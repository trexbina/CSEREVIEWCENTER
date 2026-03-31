export default function DashboardLoading() {
    return (
        <div className="w-full h-full p-8 space-y-8 animate-in fade-in duration-300">
            {/* Header Skeleton */}
            <div className="space-y-3">
                <div className="h-8 w-64 bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="h-4 w-96 bg-gray-100 rounded-lg animate-pulse"></div>
            </div>

            {/* Stats Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 space-y-4">
                        <div className="flex justify-between items-center">
                            <div className="h-4 w-24 bg-gray-100 rounded animate-pulse"></div>
                            <div className="h-10 w-10 bg-gray-50 rounded-xl animate-pulse"></div>
                        </div>
                        <div className="h-8 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
                        <div className="h-3 w-48 bg-gray-50 rounded animate-pulse"></div>
                    </div>
                ))}
            </div>

            {/* Main Layout Area Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white border border-gray-100 shadow-sm rounded-2xl p-6 space-y-6">
                    <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex justify-between items-center border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 bg-gray-100 rounded-full animate-pulse"></div>
                                    <div className="space-y-2">
                                        <div className="h-4 w-40 bg-gray-200 rounded animate-pulse"></div>
                                        <div className="h-3 w-24 bg-gray-100 rounded animate-pulse"></div>
                                    </div>
                                </div>
                                <div className="h-8 w-20 bg-gray-50 rounded-lg animate-pulse"></div>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 space-y-6">
                    <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-24 w-full bg-gray-50 rounded-xl animate-pulse"></div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

