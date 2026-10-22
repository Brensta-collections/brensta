import { EmptyState } from "@/components/ui/EmptyState";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 md:px-6">
      <EmptyState
        title="Page not found"
        description="The page you're looking for doesn't exist or has moved."
        cta={{ label: "Back to home", href: "/" }}
      />
    </div>
  );
}
