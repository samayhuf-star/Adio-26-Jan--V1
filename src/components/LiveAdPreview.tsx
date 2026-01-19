import React from 'react';
import { Phone, MapPin, Link2, DollarSign, Smartphone, MessageSquare, Building, FileText, Tag, Image as ImageIcon, X } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

interface Extension {
    id?: string;
    extensionType: string;
    [key: string]: any;
}

interface Ad {
    id: number;
    type: 'rsa' | 'dki' | 'callonly';
    headline1?: string;
    headline2?: string;
    headline3?: string;
    headline4?: string;
    headline5?: string;
    description1?: string;
    description2?: string;
    finalUrl?: string;
    path1?: string;
    path2?: string;
    phone?: string;
    businessName?: string;
    extensions?: Extension[];
    [key: string]: any;
}

interface LiveAdPreviewProps {
    ad: Ad;
    className?: string;
    onRemoveExtension?: (extensionIndex: number) => void;
}

export const LiveAdPreview: React.FC<LiveAdPreviewProps> = ({ ad, className = '', onRemoveExtension }) => {
    // Format display URL properly
    const formatDisplayUrl = () => {
        if (!ad.finalUrl) return 'example.com';
        
        try {
            // Remove protocol
            let url = ad.finalUrl.replace(/^https?:\/\//, '').replace(/^www\./, '');
            // Get base domain (first part before any path)
            const baseDomain = url.split('/')[0];
            // Add paths if they exist
            const path1 = ad.path1 ? `/${ad.path1}` : '';
            const path2 = ad.path2 ? `/${ad.path2}` : '';
            return `${baseDomain}${path1}${path2}`;
        } catch (error) {
            return ad.finalUrl.replace(/^https?:\/\//, '').replace(/^www\./, '');
        }
    };
    
    const displayUrl = formatDisplayUrl();

    const renderExtension = (ext: Extension, idx: number) => {
        const canDelete = onRemoveExtension !== undefined;
        
        const DeleteButton = canDelete ? (
            <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                    e.stopPropagation();
                    onRemoveExtension(idx);
                }}
                className="h-5 w-5 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 ml-2"
            >
                <X className="w-3 h-3" />
            </Button>
        ) : null;

        switch (ext.extensionType) {
            case 'callout':
                return Array.isArray(ext.callouts) && ext.callouts.length > 0 ? (
                    <div key={idx} className="flex items-start justify-between gap-2 mt-2">
                        <div className="flex flex-wrap gap-1.5 flex-1">
                        {ext.callouts.slice(0, 4).map((callout: string, cIdx: number) => (
                            <span key={cIdx} className="text-xs text-slate-600 px-2 py-0.5 bg-slate-50 rounded border border-slate-200">
                                {callout}
                            </span>
                        ))}
                        </div>
                        {DeleteButton}
                    </div>
                ) : null;

            case 'snippet':
                return (
                    <div key={idx} className="flex items-start justify-between gap-2 mt-2">
                        <div className="text-xs text-slate-600 flex-1">
                        <span className="font-semibold text-slate-700">{ext.header}:</span>{' '}
                        {Array.isArray(ext.values) ? ext.values.slice(0, 3).join(', ') : ''}
                        </div>
                        {DeleteButton}
                    </div>
                );

            case 'sitelink':
                return Array.isArray(ext.sitelinks) && ext.sitelinks.length > 0 ? (
                    <div key={idx} className="mt-3 pt-3 border-t border-slate-200">
                        <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="grid grid-cols-2 gap-2 flex-1">
                        {ext.sitelinks.slice(0, 4).map((sitelink: any, sIdx: number) => (
                            <div key={sIdx} className="flex items-start gap-1.5">
                                <Link2 className="w-3 h-3 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <div className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer">
                                        {sitelink.text || 'Link'}
                                    </div>
                                    {sitelink.description && (
                                        <div className="text-xs text-slate-500 line-clamp-1">{sitelink.description}</div>
                                    )}
                                </div>
                            </div>
                        ))}
                            </div>
                            {DeleteButton}
                        </div>
                    </div>
                ) : null;

            case 'call':
                return ext.phone ? (
                    <div key={idx} className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-200">
                        <div className="flex items-center gap-2 flex-1">
                        <Phone className="w-3.5 h-3.5 text-indigo-600" />
                        <span className="text-xs font-semibold text-indigo-700">{ext.phone}</span>
                        {ext.callTrackingEnabled && (
                            <Badge variant="outline" className="text-xs h-5">Call Tracking</Badge>
                        )}
                        </div>
                        {DeleteButton}
                    </div>
                ) : null;

            case 'location':
                return ext.businessName ? (
                    <div key={idx} className="mt-2 pt-2 border-t border-slate-200">
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                        <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-red-600" />
                            <span className="text-xs font-semibold text-slate-700">{ext.businessName}</span>
                        </div>
                        {(ext.addressLine1 || ext.city) && (
                            <div className="text-xs text-slate-600 ml-5 mt-0.5">
                                {[ext.addressLine1, ext.city, ext.state, ext.postalCode].filter(Boolean).join(', ')}
                            </div>
                        )}
                        {ext.phone && (
                            <div className="text-xs text-slate-600 ml-5 mt-0.5 flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {ext.phone}
                            </div>
                        )}
                            </div>
                            {DeleteButton}
                        </div>
                    </div>
                ) : null;

            case 'price':
                return ext.price ? (
                    <div key={idx} className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-200">
                        <div className="flex items-center gap-2 flex-1">
                        <DollarSign className="w-3.5 h-3.5 text-indigo-600" />
                        <span className="text-xs font-semibold text-slate-700">
                            {ext.priceQualifier && `${ext.priceQualifier} `}
                            {ext.price} {ext.unit || ''}
                        </span>
                        {ext.description && (
                            <span className="text-xs text-slate-600">- {ext.description}</span>
                        )}
                        </div>
                        {DeleteButton}
                    </div>
                ) : null;

            case 'message':
                return ext.messageText ? (
                    <div key={idx} className="flex items-start justify-between gap-2 mt-2 pt-2 border-t border-slate-200">
                        <div className="flex items-center gap-2 flex-1">
                        <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
                        <div>
                            <div className="text-xs font-semibold text-slate-700">{ext.messageText}</div>
                            <div className="text-xs text-slate-600">{ext.businessName || 'Business'} • {ext.phone || '(555) 123-4567'}</div>
                        </div>
                        </div>
                        {DeleteButton}
                    </div>
                ) : null;

            case 'leadform':
                return (
                    <div key={idx} className="mt-2 pt-2 border-t border-slate-200">
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2 flex-1">
                            <FileText className="w-3.5 h-3.5 text-blue-600 mt-0.5" />
                            <div>
                                <div className="text-xs font-semibold text-slate-700">{ext.formName || 'Get Started'}</div>
                                {ext.formDescription && (
                                    <div className="text-xs text-slate-600 mt-0.5">{ext.formDescription}</div>
                                )}
                            </div>
                            </div>
                            {DeleteButton}
                        </div>
                    </div>
                );

            case 'promotion':
                return ext.promotionText ? (
                    <div key={idx} className="mt-2 pt-2 border-t border-slate-200">
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <Tag className="w-3.5 h-3.5 text-orange-600" />
                            <span className="text-xs font-semibold text-slate-700">{ext.promotionText}</span>
                            {ext.promotionDescription && (
                                <span className="text-xs text-slate-600">- {ext.promotionDescription}</span>
                            )}
                        </div>
                        {ext.startDate && ext.endDate && (
                            <div className="text-xs text-slate-600 ml-5 mt-0.5">
                                {new Date(ext.startDate).toLocaleDateString()} - {new Date(ext.endDate).toLocaleDateString()}
                            </div>
                        )}
                            </div>
                            {DeleteButton}
                        </div>
                    </div>
                ) : null;

            case 'image':
                return ext.imageUrl ? (
                    <div key={idx} className="mt-3 pt-3 border-t border-slate-200">
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 flex-1">
                            <ImageIcon className="w-3.5 h-3.5 text-purple-600" />
                            <div>
                                <div className="text-xs font-semibold text-slate-700">{ext.imageName || 'Image'}</div>
                                {ext.imageAltText && (
                                    <div className="text-xs text-slate-600 mt-0.5">{ext.imageAltText}</div>
                                )}
                            </div>
                            </div>
                            {DeleteButton}
                        </div>
                    </div>
                ) : null;

            default:
                return null;
        }
    };

    return (
        <div className={`bg-white border-2 border-slate-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow ${className}`}>
            {/* Google Ads Style Preview */}
            <div className="space-y-2.5">
                {/* Headlines */}
                {(ad.type === 'rsa' || ad.type === 'dki') && (
                    <>
                        <div className="flex flex-wrap gap-1.5 items-center">
                            {/* Collect all headlines (RSA can have up to 15) */}
                            {[
                                ad.headline1,
                                ad.headline2,
                                ad.headline3,
                                ad.headline4,
                                ad.headline5,
                                ad.headline6,
                                ad.headline7,
                                ad.headline8,
                                ad.headline9,
                                ad.headline10,
                                ad.headline11,
                                ad.headline12,
                                ad.headline13,
                                ad.headline14,
                                ad.headline15
                            ].filter(Boolean).map((headline, idx, headlines) => (
                                <React.Fragment key={idx}>
                                    {idx > 0 && <span className="text-slate-300 mx-0.5">|</span>}
                                    <span className="text-sm font-semibold text-blue-600 hover:underline cursor-pointer">
                                        {headline}
                                    </span>
                                </React.Fragment>
                            ))}
                            {!ad.headline1 && (
                                <span className="text-sm text-slate-400 italic">No headlines</span>
                            )}
                        </div>

                        {/* Display URL */}
                        <div className="text-xs text-green-700 font-medium mt-1">
                            {displayUrl}
                        </div>

                        {/* Descriptions - show all (RSA can have up to 4) */}
                        <div className="space-y-1 mt-1">
                            {[
                                ad.description1,
                                ad.description2,
                                ad.description3,
                                ad.description4
                            ].filter(Boolean).map((desc, idx) => (
                                <div key={idx} className="text-xs text-slate-600 leading-relaxed">
                                    {desc}
                                </div>
                            ))}
                            {!ad.description1 && (
                                <div className="text-xs text-slate-400 italic">No description</div>
                            )}
                        </div>
                    </>
                )}

                {/* Call Only Ad */}
                {ad.type === 'callonly' && (
                    <>
                        <div className="text-sm font-semibold text-blue-600">
                            {ad.headline1}
                        </div>
                        {ad.headline2 && (
                            <div className="text-xs text-slate-700">
                                {ad.headline2}
                            </div>
                        )}
                        {ad.description1 && (
                            <div className="text-xs text-slate-600 leading-relaxed">
                                {ad.description1}
                            </div>
                        )}
                        {ad.description2 && (
                            <div className="text-xs text-slate-600 leading-relaxed">
                                {ad.description2}
                            </div>
                        )}
                        {(ad.phone || ad.businessName) && (
                            <div className="text-xs text-indigo-700 font-semibold flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {ad.phone} {ad.businessName && `• ${ad.businessName}`}
                            </div>
                        )}
                    </>
                )}

                {/* Extensions */}
                {ad.extensions && ad.extensions.length > 0 && (
                    <div className="mt-3 pt-3 border-t-2 border-slate-300">
                        {ad.extensions.map((ext, idx) => renderExtension(ext, idx))}
                    </div>
                )}
            </div>
        </div>
    );
};

