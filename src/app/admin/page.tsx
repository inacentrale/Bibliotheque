"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BookOpen,
  Users,
  Plus,
  Edit,
  Trash2,
  Search,
  LogOut,
  Book,
  UserPlus,
  Mail,
  Calendar
} from "lucide-react";

interface Book {
  id: number;
  title: string;
  author: string;
  genre: string;
  published_year: number;
  available_copies: number;
  isbn?: string;
  cover_url?: string; // Ajout du champ pour la couverture
}

interface Student {
  id: number;
  name: string;
  email: string;
  borrowedBooks: number;
}

const API_URL = "http://localhost:5000/admin";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"books" | "students">("books");
  const [books, setBooks] = useState<Book[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Book | Student | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [bookForm, setBookForm] = useState({
    title: "",
    author: "",
    genre: "",
    published_year: new Date().getFullYear(),
    available_copies: 1,
    isbn: "",
    cover_url: ""
  });
  const [studentForm, setStudentForm] = useState({
    name: "",
    email: ""
  });
  const [coverFile, setCoverFile] = useState<File | null>(null); // Pour stocker le fichier sélectionné
  const [uploadingCover, setUploadingCover] = useState(false); // Pour l'état d'upload

  // Toast
  const toast = (message: string) => window.alert(message);

  // Fetch books
  const fetchBooks = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/books`);
      if (!res.ok) throw new Error("Erreur lors du chargement des livres");
      const data = await res.json();
      setBooks(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch students
  const fetchStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/users`);
      if (!res.ok) throw new Error("Erreur lors du chargement des étudiants");
      const data = await res.json();
      setStudents(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
    fetchStudents();
  }, []);

  // Gestion de l'upload Cloudinary
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_PRESET || "unsigned_preset");
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (!res.ok) {
        console.error("Cloudinary error:", data);
        throw new Error(data.error?.message || "Erreur lors de l'upload de l'image");
      }
      setBookForm((prev) => ({ ...prev, cover_url: data.secure_url }));
      toast("Image uploadée avec succès!");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Ajout d'un livre avec upload de couverture
  const handleAddBook = async () => {
    if (!bookForm.title || !bookForm.author || !bookForm.genre || !bookForm.isbn) {
      toast("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("title", bookForm.title);
      formData.append("author", bookForm.author);
      formData.append("genre", bookForm.genre);
      formData.append("published_year", String(bookForm.published_year));
      formData.append("available_copies", String(bookForm.available_copies));
      formData.append("isbn", bookForm.isbn);
      if (coverFile) formData.append("cover", coverFile);
      const res = await fetch(`${API_URL}/books`, {
        method: "POST",
        body: formData
      });
      if (!res.ok) throw new Error("Erreur lors de l'ajout du livre");
      await fetchBooks();
      setShowAddModal(false);
      setBookForm({ title: "", author: "", genre: "", published_year: new Date().getFullYear(), available_copies: 1, isbn: "", cover_url: "" });
      setCoverFile(null);
      toast("Livre ajouté avec succès!");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditBook = (book: Book) => {
    setEditingItem(book);
    setBookForm({
      title: book.title,
      author: book.author,
      genre: book.genre,
      published_year: book.published_year,
      available_copies: book.available_copies,
      isbn: (book as any).isbn || "",
      cover_url: book.cover_url || ""
    });
    setCoverFile(null);
    setShowAddModal(true);
  };

  const handleUpdateBook = async () => {
    if (!editingItem || !bookForm.title || !bookForm.author || !bookForm.genre || !bookForm.isbn) {
      toast("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    setLoading(true);
    setError(null);
    let coverUrl = bookForm.cover_url;
    if (coverFile) {
      coverUrl = await uploadToCloudinary(coverFile);
    }
    try {
      const res = await fetch(`${API_URL}/books/${(editingItem as Book).id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...bookForm, cover_url: coverUrl })
      });
      if (!res.ok) throw new Error("Erreur lors de la modification du livre");
      await fetchBooks();
      setShowAddModal(false);
      setEditingItem(null);
      setBookForm({ title: "", author: "", genre: "", published_year: new Date().getFullYear(), available_copies: 1, isbn: "", cover_url: "" });
      setCoverFile(null);
      toast("Livre modifié avec succès!");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBook = async (id: number) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce livre?")) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/books/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erreur lors de la suppression du livre");
      await fetchBooks();
      toast("Livre supprimé avec succès!");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // CRUD Students
  const handleAddStudent = async () => {
    if (!studentForm.name || !studentForm.email) {
      toast("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(studentForm)
      });
      if (!res.ok) throw new Error("Erreur lors de l'ajout de l'étudiant");
      await fetchStudents();
      setShowAddModal(false);
      setStudentForm({ name: "", email: "" });
      toast("Étudiant ajouté avec succès!");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditStudent = (student: Student) => {
    setEditingItem(student);
    setStudentForm({
      name: student.name,
      email: student.email
    });
    setShowAddModal(true);
  };

  const handleUpdateStudent = async () => {
    if (!editingItem || !studentForm.name || !studentForm.email) {
      toast("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/users/${(editingItem as Student).id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(studentForm)
      });
      if (!res.ok) throw new Error("Erreur lors de la modification de l'étudiant");
      await fetchStudents();
      setShowAddModal(false);
      setEditingItem(null);
      setStudentForm({ name: "", email: "" });
      toast("Étudiant modifié avec succès!");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async (id: number) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet étudiant?")) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/users/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erreur lors de la suppression de l'étudiant");
      await fetchStudents();
      toast("Étudiant supprimé avec succès!");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Filtrage
  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.genre.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setEditingItem(null);
    setBookForm({ title: "", author: "", genre: "", published_year: new Date().getFullYear(), available_copies: 1, isbn: "", cover_url: "" });
    setStudentForm({ name: "", email: "" });
    setShowAddModal(false);
  };

  // Gestion du fichier de couverture (handler manquant)
  const handleCoverFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setCoverFile(file);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="inline-flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">MonLivre Admin</span>
            </Link>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Administrateur</span>
              <Link href="/login">
                <Button variant="outline" size="sm">
                  <LogOut className="h-4 w-4 mr-2" />
                  Déconnexion
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Titre et statistiques */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Tableau de bord administrateur</h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="flex items-center p-6">
                <Book className="h-8 w-8 text-blue-600 mr-4" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{books.length}</p>
                  <p className="text-gray-600">Livres total</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center p-6">
                <Users className="h-8 w-8 text-green-600 mr-4" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{students.length}</p>
                  <p className="text-gray-600">Étudiants inscrits</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center p-6">
                <BookOpen className="h-8 w-8 text-orange-600 mr-4" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {students.reduce((acc, s) => acc + (s.borrowedBooks || 0), 0)}
                  </p>
                  <p className="text-gray-600">Livres empruntés</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        {/* Onglets */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
            <button
              onClick={() => setActiveTab("books")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "books"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Book className="h-4 w-4 inline mr-2" />
              Gestion des livres
            </button>
            <button
              onClick={() => setActiveTab("students")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "students"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Users className="h-4 w-4 inline mr-2" />
              Gestion des étudiants
            </button>
          </div>
        </div>
        {/* Barre de recherche et bouton d'ajout */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder={`Rechercher ${activeTab === "books" ? "un livre" : "un étudiant"}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={() => setShowAddModal(true)} className="flex items-center space-x-2">
            {activeTab === "books" ? <Plus className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
            <span>Ajouter {activeTab === "books" ? "un livre" : "un étudiant"}</span>
          </Button>
        </div>
        {/* Gestion des erreurs et chargement */}
        {error && <div className="mb-4 text-red-600">{error}</div>}
        {loading && <div className="mb-4 text-blue-600">Chargement...</div>}
        {/* Contenu principal */}
        {activeTab === "books" ? (
          <Card>
            <CardHeader>
              <CardTitle>Liste des livres ({filteredBooks.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold">Couverture</th>
                      <th className="text-left py-3 px-4 font-semibold">Titre</th>
                      <th className="text-left py-3 px-4 font-semibold">Auteur</th>
                      <th className="text-left py-3 px-4 font-semibold">Genre</th>
                      <th className="text-left py-3 px-4 font-semibold">Année</th>
                      <th className="text-left py-3 px-4 font-semibold">Copies</th>
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
                              alt={book.title}
                              className="w-12 h-16 object-cover rounded shadow"
                              onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
                            />
                          ) : (
                            <img src="/placeholder.svg" alt="placeholder" className="w-12 h-16 object-cover rounded shadow" />
                          )}
                        </td>
                        <td className="py-4 px-4 font-medium">{book.title}</td>
                        <td className="py-4 px-4 text-gray-600">{book.author}</td>
                        <td className="py-4 px-4">{book.genre}</td>
                        <td className="py-4 px-4 text-gray-600">{book.published_year}</td>
                        <td className="py-4 px-4 text-gray-600">{book.available_copies}</td>
                        <td className="py-4 px-4">
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline" onClick={() => handleEditBook(book)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteBook(book.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Liste des étudiants ({filteredStudents.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold">Nom</th>
                      <th className="text-left py-3 px-4 font-semibold">Email</th>
                      <th className="text-left py-3 px-4 font-semibold">Livres empruntés</th>
                      <th className="text-left py-3 px-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student) => (
                      <tr key={student.id} className="border-b hover:bg-gray-50">
                        <td className="py-4 px-4 font-medium">{student.name}</td>
                        <td className="py-4 px-4 text-gray-600">
                          <div className="flex items-center">
                            <Mail className="h-3 w-3 mr-2 text-gray-400" />
                            {student.email}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
                            {student.borrowedBooks}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex space-x-2">
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteStudent(student.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
        {/* Modal d'ajout/modification */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>
                  {editingItem ? 'Modifier' : 'Ajouter'} {activeTab === "books" ? 'un livre' : 'un étudiant'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activeTab === "books" ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Titre *</Label>
                      <Input
                        id="title"
                        value={bookForm.title}
                        onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                        placeholder="Titre du livre"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="author">Auteur *</Label>
                      <Input
                        id="author"
                        value={bookForm.author}
                        onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                        placeholder="Nom de l'auteur"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="genre">Genre *</Label>
                      <Input
                        id="genre"
                        value={bookForm.genre}
                        onChange={(e) => setBookForm({ ...bookForm, genre: e.target.value })}
                        placeholder="Genre du livre"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="published_year">Année</Label>
                      <Input
                        id="published_year"
                        type="number"
                        value={bookForm.published_year}
                        onChange={(e) => setBookForm({ ...bookForm, published_year: parseInt(e.target.value) || new Date().getFullYear() })}
                        placeholder="Année de publication"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="available_copies">Copies disponibles</Label>
                      <Input
                        id="available_copies"
                        type="number"
                        value={bookForm.available_copies}
                        onChange={(e) => setBookForm({ ...bookForm, available_copies: parseInt(e.target.value) || 1 })}
                        placeholder="Nombre de copies"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="isbn">ISBN *</Label>
                      <Input
                        id="isbn"
                        value={bookForm.isbn}
                        onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })}
                        placeholder="ISBN du livre"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cover_url">Page de couverture</Label>
                      <Input
                        id="cover_url"
                        type="file"
                        accept="image/*"
                        onChange={handleCoverFile}
                      />
                      {coverFile && (
                        <img src={URL.createObjectURL(coverFile)} alt="Aperçu couverture" className="w-20 h-28 object-cover mt-2 rounded shadow" />
                      )}
                      {!coverFile && bookForm.cover_url && (
                        <img src={bookForm.cover_url} alt="Aperçu couverture" className="w-20 h-28 object-cover mt-2 rounded shadow" />
                      )}
                    </div>
                    <div className="flex space-x-2 mt-6">
                      <Button
                        onClick={editingItem
                          ? (activeTab === "books" ? handleUpdateBook : handleUpdateStudent)
                          : (activeTab === "books" ? handleAddBook : handleAddStudent)
                        }
                        className="flex-1"
                      >
                        {editingItem ? 'Modifier' : 'Ajouter'}
                      </Button>
                      <Button variant="outline" onClick={resetForm} className="flex-1">
                        Annuler
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nom complet *</Label>
                      <Input
                        id="name"
                        value={studentForm.name}
                        onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                        placeholder="Prénom Nom"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={studentForm.email}
                        onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                        placeholder="etudiant@university.edu"
                      />
                    </div>
                    <div className="flex space-x-2 mt-6">
                      <Button
                        onClick={editingItem ? handleUpdateStudent : handleAddStudent}
                        className="flex-1"
                      >
                        {editingItem ? 'Modifier' : 'Ajouter'}
                      </Button>
                      <Button variant="outline" onClick={resetForm} className="flex-1">
                        Annuler
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}