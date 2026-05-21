import { requireGuest } from "@/lib/auth-session";

export default async function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    await requireGuest();

    return (
        <div className="min-h-screen grid lg:grid-cols-2">

            <div className="hidden lg:flex flex-col justify-between bg-zinc-900 p-10 text-white">
                <div className="flex items-center gap-2 font-semibold text-lg">
                    <div className="size-7 rounded-md bg-indigo-500 flex items-center justify-center text-white text-sm font-bold">
                        F
                    </div>
                    FlowCRM
                </div>

                <blockquote className="space-y-2">
                    <p className="text-lg text-zinc-300">
                        &ldquo;FlowCRM helped us close 40% more deals in the first month.
                        Finally a CRM that gets out of the way.&rdquo;
                    </p>
                    <footer className="text-sm text-zinc-500">
                        rafbobbob@gmail.com
                    </footer>
                </blockquote>
            </div>


            <div className="flex items-center justify-center p-8">
                <div className="w-full max-w-sm">{children}</div>
            </div>
        </div>
    );
}