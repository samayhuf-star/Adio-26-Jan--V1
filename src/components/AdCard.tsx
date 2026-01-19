import React from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Edit, Copy, Trash2 } from 'lucide-react';

interface AdCardProps {
    headline: string;
    displayUrl: string;
    description: string;
    extension?: string;
    onEdit: () => void;
    onDuplicate: () => void;
    onDelete: () => void;
}

export const AdCard = ({ 
    headline, 
    displayUrl, 
    description, 
    extension, 
    onEdit, 
    onDuplicate, 
    onDelete 
}: AdCardProps) => {
    return (
        <div className="bg-white border border-slate-200 rounded-lg p-4 mb-3 hover:shadow-md transition-shadow">
            {/* Ad Preview */}
            <div className="mb-3">
                <div className="text-blue-600 hover:underline cursor-pointer mb-1">
                    {headline}
                </div>
                <div className="text-indigo-700 text-sm mb-1">
                    {displayUrl}
                </div>
                <div className="text-slate-600 text-sm">
                    {description}
                </div>
            </div>

            {/* Extension (if present) */}
            {extension && (
                <div className="bg-indigo-50 border border-indigo-200 rounded px-3 py-2 mb-3">
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-white border-red-300 text-red-600 text-xs">
                            ❌ 20% OFF Today | Spring Sales
                        </Badge>
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                        {extension}
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
                <Button
                    onClick={onEdit}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    size="sm"
                >
                    EDIT
                </Button>
                <Button
                    onClick={onDuplicate}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                    size="sm"
                >
                    DUPLICATE
                </Button>
                <Button
                    onClick={onDelete}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    size="sm"
                >
                    DELETE
                </Button>
            </div>
        </div>
    );
};
