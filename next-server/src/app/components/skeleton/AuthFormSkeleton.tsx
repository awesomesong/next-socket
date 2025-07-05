import { Card, Skeleton } from "@heroui/react";

const AuthFormSkeleton = () => {
  return (
    <div className="flex flex-col justify-center min-h-full py-10 max-sm:py-6 max-sm:px-2">
      <div className="sm:mx-auto sm:w-full sm:max-w-md space-y-3">
        <Skeleton className="w-40 h-8 mx-auto rounded-lg" />
        <Skeleton className="w-24 h-6 mx-auto rounded-lg" />
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="border-default px-4 py-8 shadow rounded-lg sm:px-10 space-y-4" radius="lg">
          <Skeleton className="w-full h-10 rounded-md" />
          <Skeleton className="w-full h-10 rounded-md" />
          <Skeleton className="w-full h-10 rounded-md" />
          <Skeleton className="w-full h-10 rounded-md" />
          <Skeleton className="w-full h-10 rounded-md" />
          <div className="relative py-2">
            <div className="w-full border-t text-neutral-400" />
          </div>
          <div className="mt-6 space-y-4">
            <Skeleton className="w-full h-10 rounded-md" />
            <Skeleton className="w-full h-10 rounded-md" />
            <Skeleton className="w-full h-10 rounded-md" />
          </div>
          <Skeleton className="w-32 h-4 mx-auto mt-6 rounded-md" />
        </Card>
      </div>
    </div>
  );
};

export default AuthFormSkeleton;