export const MobileNotSupportedScreen: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center w-screen h-screen bg-[var(--background)] px-8 text-center">
      <h1 className="text-4xl font-bold text-[var(--foreground)] mb-4">
        Everyone is fine
      </h1>
      <div className="text-6xl mb-6">🖥️</div>
      <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4">
        Desktop or Tablet Required
      </h2>
      <p className="text-lg text-[var(--foreground-muted)] max-w-md">
        This app is designed for desktop computers and tablets. Please visit us
        on a larger screen to play Everyone is fine.
      </p>
    </div>
  );
};
