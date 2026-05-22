const Footer = () => {
  return (
    <footer className="dark:bg-surfaceDark border-t border-gray-100 dark:border-white/10">
      <div className="container py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-navyGray dark:text-white/70">
        <p>© {new Date().getFullYear()} Tw@er — a mock social platform.</p>
        <p>Built on Next.js.</p>
      </div>
    </footer>
  );
};

export default Footer;
