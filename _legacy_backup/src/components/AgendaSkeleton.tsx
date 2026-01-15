import React from 'react';

const timeSlots = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"];
const daysMock = Array.from({ length: 6 });

export default function AgendaSkeleton() {
    return (
        <div className="animate-pulse">
            <div className="grid grid-cols-7 border-b border-sepia-800 bg-sepia-900">
                <div className="p-4 border-r border-sepia-800 bg-sepia-900/50" />
                {daysMock.map((_, i) => (
                    <div key={i} className="p-4 border-r border-sepia-800 flex flex-col items-center gap-2">
                        <div className="h-3 w-8 bg-sepia-800 rounded" />
                        <div className="h-5 w-6 bg-sepia-800 rounded" />
                    </div>
                ))}
            </div>

            <div className="overflow-hidden">
                {timeSlots.map((time) => (
                    <div key={time} className="grid grid-cols-7 border-b border-sepia-800/50">
                        <div className="p-6 border-r border-sepia-800 bg-sepia-950/50 flex justify-center">
                            <div className="h-3 w-10 bg-sepia-800 rounded" />
                        </div>
                        {daysMock.map((_, i) => (
                            <div key={i} className="h-[90px] border-r border-sepia-800/30 p-2">
                                <div className="w-full h-full rounded-xl bg-sepia-900/30 border border-sepia-800/20" />
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
