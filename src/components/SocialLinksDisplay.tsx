import { Button } from "@/components/ui/button";
import { getSocialIcon, getSocialLabel, type SocialLink } from "@/lib/social-utils";
import { Globe } from "lucide-react";

interface SocialLinksDisplayProps {
  links: SocialLink[];
  onLinkClick?: (link: SocialLink) => void;
}

export function SocialLinksDisplay({ links, onLinkClick }: SocialLinksDisplayProps) {
  if (!links || links.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground">Redes Sociais</h3>
      <div className="flex flex-wrap gap-2">
        {links.map((link, index) => {
          const Icon = getSocialIcon(link.platform);
          const label = getSocialLabel(link.platform);
          const isImg = typeof Icon === "string";

          return (
            <Button
              key={index}
              asChild
              variant="outline"
              size="sm"
              className="gap-2 min-h-[36px]"
            >
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onLinkClick?.(link)}
              >
                {isImg ? (
                  <img src={Icon} alt={label} className="h-5 w-5 rounded-sm" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
                {label}
              </a>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
