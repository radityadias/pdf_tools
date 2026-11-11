"use client"

import { useState } from "react"
import { Menu, X, ChevronDown } from 'lucide-react'
import { NAVBAR_LINKS, TOOL_LINKS } from "@/lib/nav"

export default function Navbar() {
    const [isActive, setIsActive] = useState(false)

    return (
        <nav className="fixed top-0 left-0 w-full bg-card border-b border-gray-200 z-50">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
            
            {/* Logo / Brand Name */}
            <div className="flex-shrink-0 flex items-center">
                <a href="/" className="flex flex-row items-end font-bold text-foreground">
                    <p className="text-4xl!">PDF</p>
                    <p className="text-primary text-xl!">Daily</p>
                </a>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex space-x-12">
                {NAVBAR_LINKS.map((link) => (
                <a
                    key={link.label}
                    href={link.href}
                    className="text-foreground hover:text-primary font-bold transition-colors duration-200"
                >
                    <p className="text-md! md:text-md! lg:text-md!">
                        {link.label}
                    </p>
                </a>
                ))}
                {/* Dropdown Tools */}
                <div className="relative group text-foreground">
                    <button className="flex gap-1 text-md font-bold hover:text-primary">
                        Convert PDF
                        <ChevronDown />
                    </button>
                    <div className="absolute hidden z-10 w-xs group-hover:block m-0 left-1/2 -translate-x-1/2">
                        <div className="mt-7 bg-card border border-gray-200 rounded-xl p-4 grid grid-cols-1 gap-4 font-bold">
                            {TOOL_LINKS.map((link) => (
                                <a 
                                    key={link.label}
                                    href={link.href}
                                    className="text-sm hover:text-primary"
                                >   
                                    {link.label}
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
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
            {NAVBAR_LINKS.map((link) => (
                <a
                key={link.label}
                href={link.href}
                className="block text-sm text-black active:text-primary font-medium py-2 rounded-md"
                onClick={() => setIsActive(false)}
                >
                {link.label}
                </a>
            ))}
            {TOOL_LINKS.map((link) => (
                <a
                key={link.label}
                href={link.href}
                className="block text-sm text-black active:text-primary font-medium py-2 rounded-md"
                onClick={() => setIsActive(false)}
                >
                {link.label}
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