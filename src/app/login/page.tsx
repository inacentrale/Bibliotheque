"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookOpen } from "lucide-react";
// TODO: Adapter useToast pour Next.js ou utiliser un toast compatible

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  // TODO: Remplacer par un toast Next.js compatible
  const toast = (msg: any) => alert(msg.title + (msg.description ? "\n" + msg.description : ""));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      try {
        const res = await fetch("http://localhost:5000/user/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        if (res.ok) {
          const data = await res.json();
          console.log("Réponse backend login:", data); // DEBUG
          // Stocker l'ID utilisateur dans le localStorage pour la session
          if (typeof window !== "undefined" && (data.userId || data.id)) {
            localStorage.setItem("userId", (data.userId || data.id).toString());
          }
          toast({
            title: "Connexion réussie !",
            description: "Bienvenue sur MonLivre.",
          });
          if (data.is_admin) {
            router.push("/admin");
          } else {
            router.push("/student");
          }
        } else {
          const text = await res.text();
          toast({
            title: "Échec de la connexion",
            description: text || "Identifiants invalides.",
          });
        }
      } catch (err) {
        toast({
          title: "Échec de la connexion",
          description: "Erreur réseau. Veuillez réessayer.",
        });
      }
    } else {
      toast({
        title: "Échec de la connexion",
        description: "Veuillez remplir tous les champs.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">MonLivre</span>
          </Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Bienvenue sur MonLivre</CardTitle>
            <CardDescription>
              Connectez-vous à votre compte pour accéder à la bibliothèque
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="student@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Connexion
              </Button>
            </form>
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Vous n'avez pas de compte ?{" "}
                <Link href="/register" className="text-blue-600 hover:underline">
                  Inscrivez-vous ici
                </Link>
              </p>
            </div>
            {/* Demo credentials */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-2">Informations de connexion :</p>
              <p className="text-xs text-gray-600">Étudiant : student@monlivre.edu</p>
              <p className="text-xs text-gray-600">Admin : admin@monlivre.edu</p>
              <p className="text-xs text-gray-600">Mot de passe : n'importe quel mot de passe</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
