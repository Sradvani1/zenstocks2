export default function OfflinePage() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col items-center justify-center px-6 text-center">
      <h1 className="text-2xl font-semibold">No connection</h1>
      <p className="mt-2 text-muted-foreground">
        ZenStocks needs a network connection to load portfolio data.
      </p>
    </div>
  );
}
