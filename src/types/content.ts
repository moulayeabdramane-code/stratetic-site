export interface NavLink {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
}

export interface CaseStudy {
  title: string;
  description: string;
  placeholderLabel: string;
}

export interface ServiceCard {
  title: string;
  description: string;
  icon: "commercial" | "corporate" | "social" | "brandFilm" | "animation" | "education";
}

export interface ClientName {
  name: string;
}

export interface AudienceCard {
  title: string;
  description: string;
  placeholderLabel: string;
}

export interface BlogPost {
  title: string;
  excerpt: string;
  placeholderLabel: string;
}

export interface Testimonial {
  quote: string;
  name: string;
  role: string;
}

export interface FooterLinkGroup {
  heading?: string;
  links: { label: string; href: string }[];
}
