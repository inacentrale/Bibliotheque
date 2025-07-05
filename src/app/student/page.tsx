"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  BookOpen, 
  User, 
  Calendar, 
  Search, 
  LogOut,
  Book,
  RotateCcw,
  Mail,
  IdCard,
  Clock,
  CheckCircle,
  AlertTriangle,
  Eye
} from "lucide-react";

// Types
interface BorrowedBook {
  id: number;
  title: string;
  author: string;
  genre: string;
  cover_url: string; // Correction ici
  borrowDate: string;
  dueDate: string;
  isbn: string;
  renewalCount: number;
  maxRenewals: number;
  isOverdue: boolean;
}

interface StudentProfile {
  id: number;
  name: string;
  email: string;
  studentId: string;
  registrationDate: string;
  status: "active" | "suspended";
  maxBooks: number;
}

export default function StudentDashboard() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [borrowedBooks, setBorrowedBooks] = useState<BorrowedBook[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Toast simple (remplacer par un vrai toast si besoin)
  const toast = (message: string) => alert(message);

  // Charger dynamiquement le profil et les livres empruntés à chaque accès
  useEffect(() => {
    const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;
    if (!userId) {
      setLoading(false);
      setError("Vous n'êtes pas authentifié. Veuillez vous connecter.");
      return;
    }
    setLoading(true);
    setError(null);
    Promise.all([
      fetch(`http://localhost:5000/user/profile/${userId}`).then(r => {
        if (!r.ok) throw new Error("Erreur lors du chargement du profil utilisateur");
        return r.json();
      }),
      fetch(`http://localhost:5000/user/borrowed-books/${userId}`).then(r => {
        if (!r.ok) throw new Error("Erreur lors du chargement des livres empruntés");
        return r.json();
      })
    ])
      .then(([profileData, booksData]) => {
        console.log('DEBUG borrowed-books:', booksData); // <-- LOG POUR DEBUG
        // Adapter le mapping si besoin selon la réponse backend
        setProfile({
          id: profileData.id || userId,
          name: profileData.name,
          email: profileData.email,
          studentId: profileData.studentId || profileData.student_id || profileData.id || userId,
          registrationDate: profileData.registrationDate || profileData.registration_date || new Date().toISOString(),
          status: profileData.status || "active",
          maxBooks: profileData.maxBooks || profileData.max_books || 5
        });
        setBorrowedBooks(booksData.map((b: any) => ({
          id: b.id,
          title: b.title,
          author: b.author,
          genre: b.genre,
          cover_url: b.cover_url || b.coverImage || "",
          borrowDate: b.borrow_date,
          dueDate: b.due_date,
          isbn: b.isbn,
          renewalCount: b.renewal_count || 0,
          maxRenewals: b.max_renewals || 2,
          isOverdue: b.is_overdue || false
        })));
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Erreur inattendue");
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Chargement...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!profile) return null; // Ne rien afficher si le profil n'est pas encore chargé

  // Calculer les statistiques
  const overdueBooks = borrowedBooks.filter(book => book.isOverdue).length;
  // const availableSlots = profile.maxBooks - borrowedBooks.length;

  // Fonction pour retourner un livre (corrigée pour appeler l'API backend)
  const handleReturnBook = async (bookId: number) => {
    const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;
    if (!userId) return toast("Utilisateur non authentifié.");
    const book = borrowedBooks.find(b => b.id === bookId);
    if (book && confirm(`Êtes-vous sûr de vouloir retourner "${book.title}" ?`)) {
      try {
        const res = await fetch(`http://localhost:5000/user/return-book/${userId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ book_id: bookId })
        });
        if (!res.ok) throw new Error(await res.text());
        setBorrowedBooks(borrowedBooks.filter(b => b.id !== bookId));
        toast(`Livre "${book.title}" retourné avec succès!`);
        // Recharger la liste des livres empruntés pour cohérence
        fetch(`http://localhost:5000/user/borrowed-books/${userId}`)
          .then(r => r.json())
          .then(data => setBorrowedBooks(data.map((b: any) => ({
            id: b.id,
            title: b.title,
            author: b.author,
            genre: b.genre,
            cover_url: b.cover_url || b.coverImage || "",
            borrowDate: b.borrow_date,
            dueDate: b.due_date,
            isbn: b.isbn,
            renewalCount: b.renewal_count || 0,
            maxRenewals: b.max_renewals || 2,
            isOverdue: b.is_overdue || false
          }))));
      } catch (err: any) {
        toast("Erreur lors du retour : " + (err.message || "Erreur inconnue"));
      }
    }
  };

  // Fonction pour renouveler un emprunt
  const handleRenewBook = (bookId: number) => {
    const book = borrowedBooks.find(b => b.id === bookId);
    if (book) {
      if (book.renewalCount >= book.maxRenewals) {
        toast("Vous avez atteint le nombre maximum de renouvellements pour ce livre.");
        return;
      }
      if (book.isOverdue) {
        toast("Impossible de renouveler un livre en retard. Veuillez le retourner d'abord.");
        return;
      }

      // Renouveler pour 30 jours supplémentaires
      const newDueDate = new Date();
      newDueDate.setDate(newDueDate.getDate() + 30);
      
      setBorrowedBooks(borrowedBooks.map(b => 
        b.id === bookId 
          ? { 
              ...b, 
              dueDate: newDueDate.toISOString().split('T')[0],
              renewalCount: b.renewalCount + 1 
            }
          : b
      ));
      toast(`Emprunt renouvelé jusqu'au ${newDueDate.toLocaleDateString('fr-FR')}`);
    }
  };

  // Fonction pour voir les détails d'un livre
  const handleViewDetails = (book: BorrowedBook) => {
    const details = `
Titre: ${book.title}
Auteur: ${book.author}
Genre: ${book.genre}
ISBN: ${book.isbn}
Date d'emprunt: ${new Date(book.borrowDate).toLocaleDateString('fr-FR')}
Date de retour: ${new Date(book.dueDate).toLocaleDateString('fr-FR')}
Renouvellements: ${book.renewalCount}/${book.maxRenewals}
Statut: ${book.isOverdue ? 'En retard' : 'À jour'}
    `;
    toast(details);
  };

  // Filtrage des livres
  const filteredBooks = borrowedBooks.filter(book =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.genre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculer les jours restants
  const getDaysRemaining = (dueDate: string): number => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="inline-flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">MonLivre</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowProfile(!showProfile)}
              >
                <User className="h-4 w-4 mr-2" />
                Mon profil
              </Button>
              <Link href="/accueil">
                <Button variant="outline" size="sm">
                  <Book className="h-4 w-4 mr-2" />
                  Catalogue des livres
                </Button>
              </Link>
              {/* <Link href="/accueil"> 
                <Button variant="outline" size="sm">
                  Retour à l'accueil
                </Button>
              </Link > */}
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
        {/* Titre et informations de l'étudiant */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bonjour, {profile.name}!
          </h1>
          <p className="text-gray-600">Gérez vos emprunts de livres</p>
        </div>

        {/* Profil étudiant (collapsible) */}
        {showProfile && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Informations du profil</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <IdCard className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">ID Étudiant</p>
                      <p className="font-medium">{profile.studentId}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium">{profile.email}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Inscription</p>
                      <p className="font-medium">
                        {new Date(profile.registrationDate).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-sm text-gray-600">Statut</p>
                      <p className="font-medium text-green-600 capitalize">{profile.status}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="flex items-center p-6">
              <Book className="h-8 w-8 text-blue-600 mr-4" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{borrowedBooks.length}</p>
                <p className="text-gray-600">Livres empruntés</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-6">
              <AlertTriangle className="h-8 w-8 text-red-600 mr-4" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{overdueBooks}</p>
                <p className="text-gray-600">En retard</p>
              </div>
            </CardContent>
          </Card>
           {/* <Card>
            <CardContent className="flex items-center p-6">
              <CheckCircle className="h-8 w-8 text-green-600 mr-4" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{availableSlots}</p>
                <p className="text-gray-600">Slots disponibles</p>
              </div>
            </CardContent>
          </Card> */}
          <Card>
            <CardContent className="flex items-center p-6">
              <RotateCcw className="h-8 w-8 text-orange-600 mr-4" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {borrowedBooks.reduce((sum, book) => sum + book.renewalCount, 0)}
                </p>
                <p className="text-gray-600">Renouvellements</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Barre de recherche */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Rechercher dans mes livres..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Liste des livres empruntés */}
        <Card>
          <CardHeader>
            <CardTitle>Mes livres empruntés ({filteredBooks.length})</CardTitle>
            <CardDescription>
              Gérez vos emprunts et retours de livres
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredBooks.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-2">
                  {borrowedBooks.length === 0 ? "Aucun livre emprunté" : "Aucun livre trouvé"}
                </p>
                <p className="text-gray-400 mb-4">
                  {borrowedBooks.length === 0 
                    ? "Visitez notre catalogue pour emprunter des livres" 
                    : "Essayez une recherche différente"
                  }
                </p>
                {borrowedBooks.length === 0 && (
                  <Link href="/accueil">
                    <Button>
                      <Book className="h-4 w-4 mr-2" />
                      Parcourir le catalogue
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold">Couverture</th>
                      <th className="text-left py-3 px-4 font-semibold">Livre</th>
                      <th className="text-left py-3 px-4 font-semibold">Genre</th>
                      <th className="text-left py-3 px-4 font-semibold">Date d'emprunt</th>
                      <th className="text-left py-3 px-4 font-semibold">Date de retour</th>
                      <th className="text-left py-3 px-4 font-semibold">Statut</th>
                      <th className="text-left py-3 px-4 font-semibold">Renouvellements</th>
                      <th className="text-left py-3 px-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBooks.map((book) => {
                      const daysRemaining = getDaysRemaining(book.dueDate);
                      return (
                        <tr key={book.id} className="border-b hover:bg-gray-50">
                          <td className="py-4 px-4">
                            {book.cover_url ? (
                              <img
                                src={book.cover_url}
                                alt={`Couverture de ${book.title}`}
                                className="w-16 h-20 object-cover rounded shadow-sm"
                              />
                            ) : (
                              <img
                                src="/placeholder.svg"
                                alt="placeholder"
                                className="w-16 h-20 object-cover rounded shadow-sm"
                              />
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <div>
                              <p className="font-medium text-gray-900">{book.title}</p>
                              <p className="text-sm text-gray-600">par {book.author}</p>
                              <p className="text-xs text-gray-500 font-mono">{book.isbn}</p>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {book.genre}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center text-sm text-gray-600">
                              <Calendar className="h-3 w-3 mr-1" />
                              {new Date(book.borrowDate).toLocaleDateString('fr-FR')}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center text-sm">
                              <Calendar className="h-3 w-3 mr-1" />
                              <span className={book.isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}>
                                {new Date(book.dueDate).toLocaleDateString('fr-FR')}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            {book.isOverdue ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                En retard ({Math.abs(daysRemaining)} jours)
                              </span>
                            ) : daysRemaining <= 3 ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                <Clock className="h-3 w-3 mr-1" />
                                {daysRemaining} jour{daysRemaining > 1 ? 's' : ''} restant{daysRemaining > 1 ? 's' : ''}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                À jour ({daysRemaining} jours)
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="text-sm text-gray-600">
                              {book.renewalCount}/{book.maxRenewals}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex space-x-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewDetails(book)}
                                title="Voir les détails"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRenewBook(book.id)}
                                disabled={book.renewalCount >= book.maxRenewals || book.isOverdue}
                                title="Renouveler l'emprunt"
                              >
                                <RotateCcw className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleReturnBook(book.id)}
                                className="bg-blue-600 hover:bg-blue-700"
                                title="Retourner le livre"
                              >
                                <BookOpen className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Aide et informations */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Informations importantes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Règles d'emprunt</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Durée d'emprunt : 30 jours</li>
                  <li>• Maximum {profile.maxBooks} livres simultanément</li>
                  <li>• 2 renouvellements maximum par livre</li>
                  <li>• Pas de renouvellement si le livre est en retard</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">En cas de problème</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Contactez la bibliothèque : library@university.edu</li>
                  <li>• Téléphone : 01 23 45 67 89</li>
                  <li>• Horaires : Lun-Ven 8h-18h, Sam 9h-12h</li>
                  <li>• Bureau : Bâtiment A, Rez-de-chaussée</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}