import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BookOpen, Users, Clock, Star } from "lucide-react";

const popularBooks = [
  {
    id: 1,
    title: "Data Structures and Algorithms",
    author: "Thomas H. Cormen",
    rating: 4.8,
    genre: "Computer Science",
    cover:
      "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=200&h=280&fit=crop",
  },
  {
    id: 2,
    title: "Introduction à la Psychologie",
    author: "David G. Myers",
    rating: 4.6,
    genre: "Psychologie",
    cover:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=280&fit=crop",
  },
  {
    id: 3,
    title: "Calculus: Early Transcendentals",
    author: "James Stewart",
    rating: 4.5,
    genre: "Mathématiques",
    cover:
      "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=200&h=280&fit=crop",
  },
  {
    id: 4,
    title: "Modern Physics",
    author: "Kenneth S. Krane",
    rating: 4.7,
    genre: "Physiques",
    cover:
      "https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=200&h=280&fit=crop",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">MonLivre</h1>
            </div>
            <div className="flex space-x-4">
              <Link href="/login">
                <Button variant="outline">Connexion</Button>
              </Link>
              <Link href="/register">
                <Button>Inscription</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Bienvenu sur MonLivre
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Votre passerelle vers la connaissance. Accédez à des milliers de ressources académiques,
            gérez vos livres empruntés et explorez notre vaste collection de
            manuels, articles de recherche et matériaux numériques.
          </p>
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Des milliers de livres</h3>
              <p className="text-gray-600">
                Collection exceptionnelle dans toutes les disciplines
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">24/7 Accès</h3>
              <p className="text-gray-600">
                Disponible à tout moment et en tout lieu pour les étudiants
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Clock className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Reservations faciles</h3>
              <p className="text-gray-600">
                Système de réservation de livres rapide et simple
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Books */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h3 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Livres Populaires
        </h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {popularBooks.map((book) => (
            <Card key={book.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="p-4">
                <img
                  src={book.cover}
                  alt={book.title}
                  className="w-full h-48 object-cover rounded-md mb-4"
                />
                <CardTitle className="text-lg line-clamp-2">
                  {book.title}
                </CardTitle>
                <CardDescription>{book.author}</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{book.genre}</span>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{book.rating}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2025 MonLivre. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}
