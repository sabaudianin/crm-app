"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Building2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const onboardingSchema = z.object({
    name: z
        .string()
        .min(2, "Nazwa musi mieć minimum 2 znaki")
        .max(50, "Nazwa może mieć maksymalnie 50 znaków"),
    slug: z
        .string()
        .min(2, "Slug musi mieć minimum 2 znaki")
        .max(50, "Slug może mieć maksymalnie 50 znaków")
        .regex(
            /^[a-z0-9-]+$/,
            "Slug może zawierać tylko małe litery, cyfry i myślniki"
        ),
});

type OnboardingValues = z.infer<typeof onboardingSchema>;

function toSlug(name: string) {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
}

export default function OnboardingPage() {
    const router = useRouter();

    const form = useForm<OnboardingValues>({
        resolver: zodResolver(onboardingSchema),
        defaultValues: { name: "", slug: "" },
    });

    // Auto-generuj slug z nazwy
    function handleNameChange(value: string) {
        form.setValue("name", value);
        const currentSlug = form.getValues("slug");
        const expectedSlug = toSlug(form.getValues("name"));
        // Nadpisuj slug tylko jeśli użytkownik go nie edytował ręcznie
        if (!currentSlug || currentSlug === expectedSlug) {
            form.setValue("slug", toSlug(value), { shouldValidate: true });
        }
    }

    async function onSubmit(values: OnboardingValues) {
        const { error } = await authClient.organization.create({
            name: values.name,
            slug: values.slug,
        });

        if (error) {
            if (error.message?.includes("slug")) {
                form.setError("slug", { message: "Ten slug jest już zajęty" });
                return;
            }
            toast.error(error.message ?? "Błąd podczas tworzenia organizacji");
            return;
        }

        toast.success(`Workspace "${values.name}" został utworzony!`);
        router.push("/dashboard");
        router.refresh();
    }

    return (
        <div className="space-y-8">
            <div className="space-y-2 text-center">
                <div className="flex justify-center">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-indigo-600 text-white">
                        <Building2 className="size-6" />
                    </div>
                </div>
                <h1 className="text-2xl font-semibold tracking-tight">
                    Stwórz swój workspace
                </h1>
                <p className="text-sm text-muted-foreground">
                    Workspace to przestrzeń dla Twojego zespołu. Możesz go później
                    przemianować.
                </p>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nazwa firmy / zespołu</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="Acme Inc."
                                        {...field}
                                        onChange={(e) => handleNameChange(e.target.value)}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="slug"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>URL workspace</FormLabel>
                                <FormControl>
                                    <div className="flex items-center rounded-md border bg-muted/50 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                                        <span className="px-3 text-sm text-muted-foreground border-r py-2">
                                            flowcrm.app/
                                        </span>
                                        <Input
                                            className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                                            placeholder="acme-inc"
                                            {...field}
                                        />
                                    </div>
                                </FormControl>
                                <FormDescription>
                                    Tylko małe litery, cyfry i myślniki
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={form.formState.isSubmitting}
                    >
                        {form.formState.isSubmitting
                            ? "Tworzenie workspace..."
                            : "Stwórz workspace i przejdź dalej →"}
                    </Button>
                </form>
            </Form>
        </div>
    );
}