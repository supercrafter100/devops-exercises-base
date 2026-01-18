import React from 'react';
import { Activity } from 'lucide-react';

export default function Header() {
    return (
        <header className='bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-lg'>
            <div className='container mx-auto px-6 py-4'>
                <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-3'>
                        <div className='bg-primary-500 p-2 rounded-lg'>
                            <Activity className='w-6 h-6' />
                        </div>
                        <div>
                            <h1 className='text-xl font-bold'>
                                Distributed Telemetry Archival Platform
                            </h1>
                            <p className='text-sm text-slate-300'>
                                Real-time Event Collection & Analysis
                            </p>
                        </div>
                    </div>
                    <div className='flex items-center space-x-4'>
                        <div className='text-right'>
                            <div className='text-xs text-slate-400'>
                                System Status
                            </div>
                            <div className='flex items-center space-x-2'>
                                <span className='inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse'></span>
                                <span className='text-sm font-medium'>
                                    Operational
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
