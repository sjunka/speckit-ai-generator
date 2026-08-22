import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center justify-center px-4 md:max-w-2xl lg:max-w-4xl">
      <div className="w-full rounded-[8px] border border-hairline bg-surface-1 p-4">
        <SignIn forceRedirectUrl="/capture" />
      </div>
    </main>
  );
}
