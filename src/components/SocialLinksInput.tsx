import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { detectSocialPlatform, getSocialIcon, type SocialLink } from "@/lib/social-utils";

interface SocialLinksInputProps {
  value: SocialLink[];
  onChange: (links: SocialLink[]) => void;
}

export function SocialLinksInput({ value, onChange }: SocialLinksInputProps) {
  const [newUrl, setNewUrl] = useState("");

  const addLink = () => {
    const url = newUrl.trim();
    if (!url) return;
    const platform = detectSocialPlatform(url);
    onChange([...value, { url, platform }]);
    setNewUrl("");
  };

  const removeLink = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addLink();
    }
  };

  return (
    <div className="space-y-3">
      <Label>Redes Sociais / Links</Label>
      <div className="flex gap-2">
        <Input
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Cole o link (Instagram, Facebook, TikTok...)"
          className="flex-1"
        />
        <Button type="button" variant="outline" size="icon" onClick={addLink}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((link, index) => {
            const Icon = getSocialIcon(link.platform);
            return (
              <div
                key={index}
                className="flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1.5 text-sm"
              >
                {typeof Icon === "string" ? (
                  <img src={Icon} alt={link.platform} className="h-4 w-4" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
                <span className="max-w-[150px] truncate capitalize">{link.platform}</span>
                <button
                  type="button"
                  onClick={() => removeLink(index)}
                  className="ml-1 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
