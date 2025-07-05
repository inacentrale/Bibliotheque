"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookOpen, Search, Eye, BookMarked } from "lucide-react";
import NavBar from "@/components/NavBar";

// Type pour un livre
interface Book {
  id: number;
  isbn: string;
  title: string;
  author: string;
  genre: string;
  published_year: number;
  cover_url: string; // Correction ici
  available_copies: number;
}

export default function HomePage() {
  const [searchTitle, setSearchTitle] = useState("");
  const [searchAuthor, setSearchAuthor] = useState("");
  const [searchGenre, setSearchGenre] = useState("");
  const [borrowedBooks, setBorrowedBooks] = useState<number[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [borrowDialogOpen, setBorrowDialogOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [returnDate, setReturnDate] = useState("");
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedBookDetails, setSelectedBookDetails] = useState<Book | null>(null);

  // Toast simple pour les notifications
  const toast = (message: string) => alert(message);

  // Charger les livres depuis l'API backend
  useEffect(() => {
    fetch("http://localhost:5000/user/books")
      .then(res => res.json())
      .then(data => {
        setBooks(data);
        setLoading(false);
      })
      .catch(() => {
        toast("Erreur lors du chargement des livres.");
        setLoading(false);
      });
  }, []);

  // Filtrage des livres
  const filteredBooks = useMemo(() => {
    return books.filter(book => {
      const titleMatch = book.title.toLowerCase().includes(searchTitle.toLowerCase());
      const authorMatch = book.author.toLowerCase().includes(searchAuthor.toLowerCase());
      const genreMatch = book.genre.toLowerCase().includes(searchGenre.toLowerCase());
      return titleMatch && authorMatch && genreMatch;
    });
  }, [books, searchTitle, searchAuthor, searchGenre]);

  // Nouvelle fonction pour ouvrir le pop-up d'emprunt
  const openBorrowDialog = (book: Book) => {
    setSelectedBook(book);
    setReturnDate("");
    setBorrowDialogOpen(true);
  };

  // Récupérer dynamiquement l'ID utilisateur depuis le localStorage
  const getUserId = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('userId');
    }
    return null;
  };

  // Nouvelle fonction pour valider l'emprunt
  const confirmBorrow = async () => {
    if (!selectedBook || !returnDate) return;
    const userId = getUserId();
    if (!userId) {
      toast("Utilisateur non authentifié. Veuillez vous reconnecter.");
      return;
    }
    try {
      const res = await fetch(`http://localhost:5000/user/books/${userId}/borrow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ book_id: selectedBook.id, book_name: selectedBook.title, date: returnDate })
      });
      const errorText = !res.ok ? await res.text() : null;
      if (!res.ok) throw new Error(errorText);
      setBorrowedBooks([...borrowedBooks, selectedBook.id]);
      toast(`Livre "${selectedBook.title}" emprunté avec succès!`);
      setBorrowDialogOpen(false);
      // Recharger la liste des livres pour mettre à jour les copies disponibles
      fetch("http://localhost:5000/user/books")
        .then(res => res.json())
        .then(data => setBooks(data));
    } catch (err: any) {
      toast("Erreur lors de l'emprunt : " + (err.message || "Erreur inconnue"));
    }
  };

  // Fonction pour voir les détails
  const handleViewDetails = (bookId: number) => {
    const book = books.find(b => b.id === bookId);
    if (book) {
      setSelectedBookDetails(book);
      setShowDetailsModal(true);
    }
  };

  // Fonction pour voir les livres empruntés
  const handleViewBorrowedBooks = () => {
    const borrowed = books.filter(book => borrowedBooks.includes(book.id));
    if (borrowed.length > 0) {
      const borrowedTitles = borrowed.map(book => book.title).join(", ");
      toast(`Livres empruntés: ${borrowedTitles}`);
    } else {
      toast("Aucun livre emprunté.");
    }
  };

  // Fallback d'image pour les couvertures
  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = "/placeholder.svg";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Modale détails livre */}
      {showDetailsModal && selectedBookDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl font-bold"
              onClick={() => setShowDetailsModal(false)}
              aria-label="Fermer"
            >
              
            </button>
            <div className="flex flex-col items-center">
              {selectedBookDetails.cover_url ? (
                <img
                  src={selectedBookDetails.cover_url}
                  alt={`Couverture de ${selectedBookDetails.title}`}
                  className="w-32 h-44 object-cover rounded shadow mb-4"
                />
              ) : (
                <img
                  src="/placeholder.svg"
                  alt="placeholder"
                  className="w-32 h-44 object-cover rounded shadow mb-4"
                />
              )}
              <h2 className="text-xl font-bold mb-2 text-center">{selectedBookDetails.title}</h2>
              <p className="mb-1 text-gray-700"><b>Auteur :</b> {selectedBookDetails.author}</p>
              <p className="mb-1 text-gray-700"><b>Genre :</b> {selectedBookDetails.genre}</p>
              <p className="mb-1 text-gray-700"><b>ISBN :</b> {selectedBookDetails.isbn}</p>
              <p className="mb-1 text-gray-700"><b>Année :</b> {selectedBookDetails.published_year}</p>
              <p className="mb-1 text-gray-700"><b>Disponibilité :</b> {selectedBookDetails.available_copies > 0 ? 'Disponible' : 'Emprunté'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Modale d'emprunt custom */}
      {borrowDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Emprunter le livre</h2>
            <p className="mb-2">Livre : <b>{selectedBook?.title}</b></p>
            <Label htmlFor="return-date">Date de retour</Label>
            <Input
              id="return-date"
              type="date"
              value={returnDate}
              onChange={e => setReturnDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="mb-4"
            />
            <div className="flex justify-end space-x-2">
              <Button onClick={confirmBorrow} disabled={!returnDate}>Confirmer</Button>
              <Button variant="outline" onClick={() => setBorrowDialogOpen(false)}>Annuler</Button>
            </div>
          </div>
        </div>
      )}

      {/* NavBar réutilisable */}
      <NavBar showProfileBtn={true} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Titre de la page */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Catalogue de la Bibliothèque</h1>
          <p className="text-gray-600">Découvrez et empruntez nos livres</p>
        </div>

        {/* Filtres */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Search className="h-5 w-5" />
              <span>Filtrer les livres</span>
            </CardTitle>
            <CardDescription>
              Recherchez par titre, auteur ou genre
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search-title">Titre</Label>
                <Input
                  id="search-title"
                  placeholder="Rechercher par titre..."
                  value={searchTitle}
                  onChange={(e) => setSearchTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="search-author">Auteur</Label>
                <Input
                  id="search-author"
                  placeholder="Rechercher par auteur..."
                  value={searchAuthor}
                  onChange={(e) => setSearchAuthor(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="search-genre">Genre</Label>
                <Input
                  id="search-genre"
                  placeholder="Rechercher par genre..."
                  value={searchGenre}
                  onChange={(e) => setSearchGenre(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liste des livres */}
        <Card>
          <CardHeader>
            <CardTitle>Livres disponibles ({filteredBooks.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Chargement des livres...</p>
              </div>
            ) : filteredBooks.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Aucun livre trouvé avec ces critères de recherche.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold">Couverture</th>
                      <th className="text-left py-3 px-4 font-semibold">ISBN</th>
                      <th className="text-left py-3 px-4 font-semibold">Titre</th>
                      <th className="text-left py-3 px-4 font-semibold">Auteur</th>
                      <th className="text-left py-3 px-4 font-semibold">Genre</th>
                      <th className="text-left py-3 px-4 font-semibold">Année</th>
                      <th className="text-left py-3 px-4 font-semibold">Statut</th>
                      <th className="text-left py-3 px-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBooks.map((book) => (
                      <tr key={book.id} className="border-b hover:bg-gray-50">
                        <td className="py-4 px-4">
                          {book.cover_url ? (
                            <img
                              src={book.cover_url}
                              alt={`Couverture de ${book.title}`}
                              className="w-16 h-20 object-cover rounded shadow-sm"
                              onError={handleImgError}
                            />
                          ) : (
                            <img
                              src="/placeholder.svg"
                              alt="placeholder"
                              className="w-16 h-20 object-cover rounded shadow-sm"
                            />
                          )}
                        </td>
                        <td className="py-4 px-4 text-gray-600">{book.isbn}</td>
                        <td className="py-4 px-4 font-medium">{book.title}</td>
                        <td className="py-4 px-4 text-gray-600">{book.author}</td>
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {book.genre}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-gray-600">{book.published_year}</td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            book.available_copies > 0
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {book.available_copies > 0 ? 'Disponible' : 'Emprunté'}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewDetails(book.id)}
                              className="flex items-center space-x-1"
                            >
                              <Eye className="h-3 w-3" />
                              <span>Détails</span>
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => openBorrowDialog(book)}
                              disabled={book.available_copies === 0 || borrowedBooks.includes(book.id)}
                              className="flex items-center space-x-1"
                            >
                              <BookOpen className="h-3 w-3" />
                              <span>Emprunter</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}