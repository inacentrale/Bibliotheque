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

export default function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const router = useRouter();
  // TODO: Remplacer par un toast Next.js compatible
  const toast = (msg: any) => alert(msg.title + (msg.description ? "\n" + msg.description : ""));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Registration failed",
        description: "Passwords do not match.",
      });
      return;
    }
    if (formData.name && formData.email && formData.password) {
      try {
        const res = await fetch("http://localhost:5000/user/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            password: formData.password,
          }),
        });
        if (res.ok) {
          toast({
            title: "Registration successful!",
            description: "Your account has been created. Please sign in.",
          });
          router.push("/login");
        } else {
          const data = await res.json().catch(() => ({}));
          toast({
            title: "Registration failed",
            description: data.message || "An error occurred.",
          });
        }
      } catch (err) {
        toast({
          title: "Registration failed",
          description: "Network error. Please try again.",
        });
      }
    } else {
      toast({
        title: "Registration failed",
        description: "Please fill in all fields.",
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
            <CardTitle>Créer un compte</CardTitle>
            <CardDescription>
              Rejoignez MonLivre pour accéder à notre vaste collection
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom complet</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="student@university.edu"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmez le mot de passe</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Créer un compte
              </Button>
            </form>
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Vous avez déjà un compte ?{" "}
                <Link href="/login" className="text-blue-600 hover:underline">
                  Connectez-vous ici
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
