"use client"

import { useState } from "react"
import { Menu, X } from 'lucide-react'

export default function Navbar() {
    const [isActive, setIsActive] = useState(false)
    const navLinks = [
        {name: "COMPRESS PDF", href: "/compress-pdf"},
        {name: "MERGE PDF", href: "/merge-pdf"},
        {name: "SPLIT PDF", href: "/split-pdf"},
        {name: "PDF TO JPG", href: "/pdf-to-jpg"},
        {name: "JPG TO IMG", href: "/jpg-to-pdf"},
    ]

    return (
        <nav className="fixed top-0 left-0 w-full bg-card border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
            
            {/* Logo / Brand Name */}
            <div className="flex-shrink-0 flex items-center">
                <a href="/" className="flex flex-row items-end font-bold text-foreground text-xl">
                    <p className="text-primary">Daily</p>
                    <p>PDF</p>
                </a>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex space-x-8">
                {navLinks.map((link) => (
                <a
                    key={link.name}
                    href={link.href}
                    className="text-foreground hover:text-primary font-bold transition-colors duration-200"
                >
                    {link.name}
                </a>
                ))}
            </div>

            {/* Desktop Call-to-Action Button */}
            <div className="hidden md:flex items-center">
                <button className="bg-primary hover:bg-primary/70 text-primary-foreground hover:text-secondary font-bold px-4 py-2 rounded-lg transition-colors duration-200">
                Get Started
                </button>
            </div>

            {/* Mobile Menu Button (Hamburger Icon) */}
            <div className="flex md:hidden items-center">
                <button
                onClick={() => setIsActive(!isActive)}
                className="text-primary focus:outline-none"
                aria-label="Toggle Menu"
                >
                {isActive ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
            </div>
            </div>
        </div>

        {/* Mobile Menu Dropdown */}
        <div
            className={`md:hidden absolute left-0 w-full bg-white border-b border-gray-200 transition-all duration-300 ease-in-out ${
            isActive ? 'opacity-100 translate-y-0 visible' : 'opacity-0 -translate-y-2 invisible'
            }`}
        >
            <div className="px-4 pt-2 pb-4 space-y-2 shadow-lg">
            {navLinks.map((link) => (
                <a
                key={link.name}
                href={link.href}
                className="block text-primary active:text-primary font-medium py-2 rounded-md"
                onClick={() => setIsActive(false)}
                >
                {link.name}
                </a>
            ))}
            <div className="pt-4 border-t border-gray-100">
                <button className="w-full bg-primary hover:bg-accent/70 text-white font-medium px-4 py-2 rounded-lg transition-colors duration-200">
                Get Started
                </button>
            </div>
            </div>
        </div>
        </nav>
    )
}