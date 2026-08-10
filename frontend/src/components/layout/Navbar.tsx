
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X, GraduationCap, Moon, Sun } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
	const [isOpen, setIsOpen] = useState(false);
	const [scrolled, setScrolled] = useState(false);
	const [theme, setTheme] = useState<"light" | "dark">("light");
	const pathname = usePathname() ?? "";

	useEffect(() => {
		const handleScroll = () => {
			setScrolled(window.scrollY > 20);
		};
		window.addEventListener("scroll", handleScroll);
		// Check initial theme from document class
		const isDark = document.documentElement.classList.contains("dark");
		setTheme(isDark ? "dark" : "light");
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	const toggleTheme = () => {
		const newTheme = theme === "light" ? "dark" : "light";
		setTheme(newTheme);
		if (newTheme === "dark") {
			document.documentElement.classList.add("dark");
		} else {
			document.documentElement.classList.remove("dark");
		}
	};

	const navLinks = [
		{ name: "About", href: "/about" },
		{ name: "Programs", href: "/faculties" },
		{ name: "Admissions", href: "/admissions" },
		{ name: "Campus", href: "#campus" },
		{ name: "Support", href: "#support" },
		{ name: "Research", href: "#research" },
		{ name: "Contact", href: "/contact" },
	];

	return (
		<header
			className={cn(
				"fixed top-0 left-0 right-0 z-50 transition-all duration-500",
				scrolled
					? "bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 py-3 shadow-md"
					: "bg-transparent py-6 text-white"
			)}
		>
			<div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
				<Link href="/" className="flex items-center gap-2 font-serif text-2xl font-bold tracking-tight transition-transform hover:scale-105">
					<motion.div 
						whileHover={{ rotate: 15 }}
						className={cn("p-2 rounded-xl shadow-lg", (scrolled || theme === "dark") ? "bg-primary text-white" : "bg-white text-primary")}
					>
						<GraduationCap className="h-7 w-7" />
					</motion.div>
					  <span className={cn("hidden sm:inline", !scrolled && theme === "light" && "text-white")}>ARU</span>
				</Link>
				<nav className="hidden lg:flex items-center gap-1">
					{navLinks.map((link) => (
						<Link key={link.name} href={link.href} legacyBehavior>
							<a
								className={cn(
									"px-4 py-2 rounded-full text-sm font-medium transition-all relative group",
									pathname === link.href
										? scrolled ? "bg-primary/10 text-primary" : "bg-white/20 text-white"
										: scrolled || theme === "dark" ? "text-slate-600 dark:text-slate-300 hover:text-primary" : "text-white/90 hover:text-white"
								)}
							>
								{link.name}
								<span className={cn(
									"absolute bottom-1 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-current transition-all group-hover:w-1/2",
									pathname === link.href && "w-1/2"
								)} />
							</a>
						</Link>
					))}
				</nav>
				<div className="hidden lg:flex items-center gap-4">
					<Button
						variant="ghost"
						size="icon"
						onClick={toggleTheme}
						className={cn("rounded-full transition-all duration-300")}
						aria-label="Toggle theme"
					>
						<AnimatePresence mode="wait" initial={false}>
							<motion.div
								key={theme}
								initial={{ y: -20, opacity: 0, rotate: -45 }}
								animate={{ y: 0, opacity: 1, rotate: 0 }}
								exit={{ y: 20, opacity: 0, rotate: 45 }}
								transition={{ duration: 0.2 }}
							>
								{theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
							</motion.div>
						</AnimatePresence>
					</Button>
					<Link href="/login">
						<Button className="rounded-full px-8 text-white transition-all bg-[#4fd1e9] hover:bg-[#3bbdd6] shadow-xl shadow-[0_10px_30px_rgba(79,209,233,0.35)] hover:scale-105 active:scale-95">
							Login
						</Button>
					</Link>
				</div>
				<button
					className={cn("lg:hidden p-2 rounded-lg transition-colors", scrolled || theme === "dark" ? "text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800" : "text-white hover:bg-white/20")}
					onClick={() => setIsOpen(!isOpen)}
					aria-label="Toggle menu"
				>
					{isOpen ? <X /> : <Menu />}
				</button>
			</div>
			<AnimatePresence>
				{isOpen && (
					<motion.div 
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: "auto" }}
						exit={{ opacity: 0, height: 0 }}
						className="absolute top-full left-0 right-0 bg-white dark:bg-slate-900 border-b dark:border-slate-800 shadow-2xl lg:hidden overflow-hidden"
					>
						<div className="flex flex-col p-6 gap-2">
							{navLinks.map((link) => (
								<Link key={link.name} href={link.href} legacyBehavior>
									<a
										className={cn(
											"px-6 py-4 rounded-xl text-lg font-medium transition-all flex justify-between items-center",
											pathname === link.href ? "text-primary bg-primary/5" : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
										)}
										onClick={() => setIsOpen(false)}
									>
										{link.name}
										{pathname === link.href && <motion.div layoutId="active" className="h-2 w-2 rounded-full bg-primary" />}
									</a>
								</Link>
							))}
							<div className="h-px bg-slate-100 dark:bg-slate-800 my-4" />
							<div className="flex items-center justify-between px-6 mb-4">
								<span className="text-slate-600 dark:text-slate-400">Night Mode</span>
								<Button variant="outline" size="sm" onClick={toggleTheme} className="rounded-full dark:border-slate-700">
									{theme === "light" ? <Moon className="h-4 w-4 mr-2" /> : <Sun className="h-4 w-4 mr-2" />}
									{theme === "light" ? "Night" : "Day"}
								</Button>
							</div>
							<Link href="/login" className="w-full">
								<Button className="w-full justify-center h-14 rounded-xl text-lg text-white bg-[#4fd1e9] hover:bg-[#3bbdd6] shadow-lg shadow-[0_10px_30px_rgba(79,209,233,0.35)]">
									Login
								</Button>
							</Link>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</header>
	);
}
