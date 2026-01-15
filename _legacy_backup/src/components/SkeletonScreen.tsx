
export default function SkeletonScreen() {
    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col relative overflow-hidden">
            {/* Sidebar Skeleton */}
            <div className="fixed left-0 top-0 h-screen w-20 bg-zinc-900 border-r border-zinc-800 flex flex-col items-center py-8 gap-4">
                <div className="w-10 h-10 rounded-full bg-zinc-800 animate-pulse mb-8" />
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="w-10 h-10 rounded-xl bg-zinc-800 animate-pulse" />
                ))}
                <div className="mt-auto w-10 h-10 rounded-full bg-zinc-800 animate-pulse" />
            </div>

            {/* Main Content Skeleton */}
            <div className="ml-20 flex-1 p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Header Area */}
                <div className="col-span-full mb-8">
                    <div className="w-64 h-10 bg-zinc-900 rounded-lg animate-pulse mb-2" />
                    <div className="w-40 h-6 bg-zinc-900 rounded-lg animate-pulse" />
                </div>

                {/* Cards */}
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-40 bg-zinc-900 rounded-2xl animate-pulse border border-zinc-800" />
                ))}
            </div>
        </div>
    );
}
