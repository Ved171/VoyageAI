import React from 'react';

const SkeletonBox = ({ className }: { className?: string }) => (
    <div className={`bg-gray-200 rounded-md animate-pulse ${className}`} />
);

const SkeletonBoxDark = ({ className }: { className?: string }) => (
    <div className={`bg-gray-700 rounded-md animate-pulse ${className}`} />
);

export const ItineraryHeaderSkeleton: React.FC = () => (
    <div className="bg-gray-900 rounded-2xl shadow-xl p-8 sm:p-12 mb-12 animate-fadeIn border border-gray-700">
        <SkeletonBoxDark className="h-5 w-32 mb-4" />
        <SkeletonBoxDark className="h-10 w-3/4 sm:w-1/2 mb-4" />
        <SkeletonBoxDark className="h-6 w-1/2 mb-4" />
        <div className="space-y-2 max-w-3xl">
            <SkeletonBoxDark className="h-5 w-full" />
            <SkeletonBoxDark className="h-5 w-5/6" />
        </div>
        <div className="mt-8 flex flex-wrap justify-start items-center gap-4">
            <SkeletonBoxDark className="h-12 w-48 rounded-full" />
            <SkeletonBoxDark className="h-12 w-48 rounded-full" />
        </div>
    </div>
);

export const TravelCostCardSkeleton: React.FC = () => (
    <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 text-center flex flex-col w-full max-w-sm sm:max-w-xs md:max-w-sm">
        <SkeletonBox className="h-8 w-8 mx-auto mb-4 rounded-full" />
        <SkeletonBox className="h-4 w-2/3 mx-auto mb-2" />
        <SkeletonBox className="h-12 w-3/4 mx-auto mb-4" />
        <SkeletonBox className="h-4 w-full" />
        <SkeletonBox className="h-4 w-5/6 mx-auto mt-2" />
    </div>
);

export const PackingListSkeleton: React.FC = () => (
    <div className="bg-white rounded-2xl shadow-lg p-8 mb-16 border border-gray-100">
        <div className="flex items-center mb-6">
            <SkeletonBox className="h-8 w-8 rounded-full" />
            <SkeletonBox className="h-6 w-40 ml-4" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-4">
            {Array.from({ length: 9 }).map((_, index) => (
                <div key={index} className="flex items-center">
                    <SkeletonBox className="h-5 w-5 mr-3 rounded-full" />
                    <SkeletonBox className="h-5 w-full" />
                </div>
            ))}
        </div>
    </div>
);

export const DayCardSkeleton: React.FC<{style?: React.CSSProperties}> = ({ style }) => (
    <section className="animate-fadeInUp" style={style}>
        <div className="mb-8">
            <div className="flex items-baseline space-x-4">
                <SkeletonBox className="h-12 w-24" />
                <SkeletonBox className="h-8 w-64" />
            </div>
            <div className="space-y-2 mt-4">
                <SkeletonBox className="h-5 w-full" />
                <SkeletonBox className="h-5 w-5/6" />
            </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-12">
            <div className="relative border-l-4 border-teal-100 pl-8 space-y-10">
                {/* Skeleton Activity Card */}
                <div className="relative">
                    <div className="absolute -left-14 top-0 h-10 w-10 rounded-full flex items-center justify-center ring-8 ring-white bg-gray-300 animate-pulse" />
                    <div className="ml-4 bg-white p-6 rounded-lg shadow-md border border-gray-100">
                        <SkeletonBox className="h-5 w-48 mb-3" />
                        <SkeletonBox className="h-6 w-64 mb-4" />
                        <SkeletonBox className="h-5 w-full" />
                        <SkeletonBox className="h-5 w-full mt-2" />
                    </div>
                </div>
                 <div className="relative">
                    <div className="absolute -left-14 top-0 h-10 w-10 rounded-full flex items-center justify-center ring-8 ring-white bg-gray-300 animate-pulse" />
                    <div className="ml-4 bg-white p-6 rounded-lg shadow-md border border-gray-100">
                        <SkeletonBox className="h-5 w-48 mb-3" />
                        <SkeletonBox className="h-6 w-64 mb-4" />
                        <SkeletonBox className="h-5 w-full" />
                        <SkeletonBox className="h-5 w-full mt-2" />
                    </div>
                </div>
            </div>
            <div className="mt-8 lg:mt-0">
                <SkeletonBox className="lg:sticky top-28 h-96 lg:h-[calc(100vh-9rem)] min-h-[400px] rounded-2xl" />
            </div>
        </div>
    </section>
);