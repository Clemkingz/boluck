/** Re-mounts on navigation so every app screen enters with a soft fade-up. */
export default function AppTemplate({ children }: { children: React.ReactNode }) {
	return <div className="animate-fade-up">{children}</div>;
}
