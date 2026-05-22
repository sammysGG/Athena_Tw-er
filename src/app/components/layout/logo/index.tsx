import Image from "next/image";
import Link from "next/link";

const Logo = () => {
  return (
    <Link href="/" className="flex items-center gap-2">
      <Image
        src="/images/logo.png"
        alt="Tw@er logo"
        width={36}
        height={36}
        className="rounded-md"
        priority
      />
      <span className="text-2xl font-bold tracking-tight">
        Tw<span className="text-primary">@</span>er
      </span>
    </Link>
  );
};

export default Logo;
