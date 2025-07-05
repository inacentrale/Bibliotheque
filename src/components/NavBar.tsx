"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BookOpen, User, Book, LogOut } from "lucide-react";
import React from "react";

interface NavBarProps {
  onProfileClick?: () => void;
  showProfileBtn?: boolean;
}

export default function NavBar({ onProfileClick, showProfileBtn = false }: NavBarProps) {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center space-x-2">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">MonLivre</span>
          </Link>
          <div className="flex items-center space-x-4">
            {showProfileBtn && (
              <Link href="/student">
                <Button variant="outline" size="sm">
                  <User className="h-4 w-4 mr-2" />
                  Mon profil
                </Button>
              </Link>
            )}
            <Link href="/accueil">
              <Button variant="outline" size="sm">
                <Book className="h-4 w-4 mr-2" />
                Catalogue des livres
              </Button>
            </Link>
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
  );
}
