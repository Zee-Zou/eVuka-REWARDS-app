import { useToast } from "@/components/ui/use-toast";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <div className="fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
      {toasts.map(function ({ id, title, description, action, open, onOpenChange, ...props }) {
        return (
          <div
            key={id}
            className="mb-2 flex w-full items-center justify-between rounded-md border border-gray-200 bg-white p-4 shadow-lg"
            {...props}
          >
            <div className="flex flex-col gap-1">
              {title && <div className="font-semibold">{title}</div>}
              {description && <div className="text-sm text-gray-600">{description}</div>}
            </div>
            {action}
          </div>
        );
      })}
    </div>
  );
}

export default Toaster;