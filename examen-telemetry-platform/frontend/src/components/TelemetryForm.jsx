import React, { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import api from '../services/api';

export default function TelemetryForm({ onSubmitSuccess }) {
    const [formData, setFormData] = useState({
        source: '',
        message: '',
        value: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const data = {
                source: formData.source,
                message: formData.message,
                value: formData.value ? parseFloat(formData.value) : undefined,
            };

            await api.submitTelemetry(data);

            setSuccess(true);
            setFormData({ source: '', message: '', value: '' });

            // Notify parent component
            if (onSubmitSuccess) {
                onSubmitSuccess();
            }

            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to submit telemetry');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    return (
        <div className='bg-white rounded-xl shadow-md p-6 border border-slate-200'>
            <h3 className='text-lg font-semibold text-slate-800 mb-4'>
                Submit Telemetry Event
            </h3>

            <form onSubmit={handleSubmit} className='space-y-4'>
                <div>
                    <label className='block text-sm font-medium text-slate-700 mb-2'>
                        Source *
                    </label>
                    <input
                        type='text'
                        name='source'
                        value={formData.source}
                        onChange={handleChange}
                        required
                        placeholder='e.g., server-01, app-backend, sensor-3'
                        className='w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none'
                    />
                </div>

                <div>
                    <label className='block text-sm font-medium text-slate-700 mb-2'>
                        Message
                    </label>
                    <textarea
                        name='message'
                        value={formData.message}
                        onChange={handleChange}
                        rows='3'
                        placeholder='Optional event description...'
                        className='w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none'
                    />
                </div>

                <div>
                    <label className='block text-sm font-medium text-slate-700 mb-2'>
                        Value (Metric)
                    </label>
                    <input
                        type='number'
                        name='value'
                        value={formData.value}
                        onChange={handleChange}
                        step='0.01'
                        placeholder='Optional numeric value'
                        className='w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none'
                    />
                </div>

                {error && (
                    <div className='p-3 bg-red-50 border border-red-200 rounded-lg'>
                        <p className='text-sm text-red-700'>{error}</p>
                    </div>
                )}

                {success && (
                    <div className='p-3 bg-green-50 border border-green-200 rounded-lg'>
                        <p className='text-sm text-green-700'>
                            ✓ Telemetry submitted successfully
                        </p>
                    </div>
                )}

                <button
                    type='submit'
                    disabled={loading || !formData.source}
                    className='w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2'
                >
                    {loading ? (
                        <>
                            <Loader2 className='w-5 h-5 animate-spin' />
                            <span>Submitting...</span>
                        </>
                    ) : (
                        <>
                            <Send className='w-5 h-5' />
                            <span>Submit Event</span>
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}
