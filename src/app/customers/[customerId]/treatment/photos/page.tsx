'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Webcam from 'react-webcam';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, Camera, RefreshCw, Check, Upload, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

export default function PhotoRegistrationPage() {
    const router = useRouter();
    const params = useParams();
    const customerId = params.customerId as string;

    // State
    const [activeSide, setActiveSide] = useState<'side' | 'back' | null>(null);
    const [photos, setPhotos] = useState<{ side: string | null; back: string | null }>({
        side: null,
        back: null
    });
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const webcamRef = useRef<Webcam>(null);

    const handleCapture = useCallback(() => {
        if (webcamRef.current && activeSide) {
            const imageSrc = webcamRef.current.getScreenshot();
            setPhotos(prev => ({ ...prev, [activeSide]: imageSrc }));
            setIsCameraOpen(false);
            setActiveSide(null);
        }
    }, [webcamRef, activeSide]);

    const openCamera = (side: 'side' | 'back') => {
        setActiveSide(side);
        setIsCameraOpen(true);
    };

    const retake = (side: 'side' | 'back') => {
        setPhotos(prev => ({ ...prev, [side]: null }));
        openCamera(side);
    };

    // Base64をBlobに変換
    const base64ToBlob = (base64: string): Blob => {
        const parts = base64.split(',');
        const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
        const bstr = atob(parts[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
    };

    // 写真をSupabase Storageにアップロード
    const uploadPhoto = async (base64: string, photoType: 'side' | 'back'): Promise<string | null> => {
        try {
            const blob = base64ToBlob(base64);
            const fileName = `${customerId}/${Date.now()}_${photoType}.jpg`;

            const { data, error } = await supabase.storage
                .from('treatment-photos')
                .upload(fileName, blob, {
                    contentType: 'image/jpeg',
                    upsert: true
                });

            if (error) {
                console.error('Upload error:', error);
                return null;
            }

            // 公開URLを取得
            const { data: urlData } = supabase.storage
                .from('treatment-photos')
                .getPublicUrl(data.path);

            return urlData.publicUrl;
        } catch (err) {
            console.error('Upload error:', err);
            return null;
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const photoUrls: { url: string; type: string }[] = [];

            // サイド写真をアップロード
            if (photos.side) {
                const sideUrl = await uploadPhoto(photos.side, 'side');
                if (sideUrl) {
                    photoUrls.push({ url: sideUrl, type: 'side' });
                }
            }

            // バック写真をアップロード
            if (photos.back) {
                const backUrl = await uploadPhoto(photos.back, 'back');
                if (backUrl) {
                    photoUrls.push({ url: backUrl, type: 'back' });
                }
            }

            // 写真URLをDBに保存（treatment_photosテーブル）
            if (photoUrls.length > 0) {
                for (const photo of photoUrls) {
                    await supabase
                        .from('treatment_photos')
                        .insert({
                            customer_id: customerId,
                            photo_url: photo.url,
                            photo_type: photo.type,
                        });
                }
            }
        } catch (err) {
            console.error('Save error:', err);
        }
        // 保存の成否に関わらず完了画面へ遷移
        router.push(`/customers/${customerId}/complete`);
    };

    const isComplete = photos.side && photos.back;

    return (
        <div className="min-h-screen bg-background pb-24">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ChevronLeft className="h-6 w-6" />
                </Button>
                <span className="font-bold">仕上がり写真</span>
                <div className="w-10"></div>
            </header>

            <main className="max-w-md mx-auto p-4 space-y-6">

                {/* Camera Modal Overlay */}
                {isCameraOpen && (
                    <div className="fixed inset-0 z-[60] bg-black flex flex-col items-center justify-center">
                        <div className="relative w-full h-full max-w-md flex flex-col">
                            <div className="absolute top-4 right-4 z-10">
                                <Button variant="ghost" className="text-white hover:bg-white/20" onClick={() => setIsCameraOpen(false)}>
                                    閉じる
                                </Button>
                            </div>
                            <div className="flex-1 flex items-center justify-center bg-black">
                                <Webcam
                                    audio={false}
                                    ref={webcamRef}
                                    screenshotFormat="image/jpeg"
                                    videoConstraints={{ facingMode: "environment" }}
                                    className="w-full object-cover"
                                />
                            </div>
                            <div className="p-8 pb-12 bg-black/50 backdrop-blur-sm flex justify-center items-center gap-8">
                                <p className="absolute top-[80%] text-white font-bold drop-shadow-md">
                                    {activeSide === 'side' ? '横から撮影' : '後ろから撮影'}
                                </p>
                                <Button
                                    className="h-20 w-20 rounded-full border-4 border-white bg-transparent hover:bg-white/20 active:scale-95 transition-all"
                                    onClick={handleCapture}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Photo Slots */}
                <div className="grid gap-6">

                    {/* Side Photo */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">A</span>
                            横から (Side)
                        </h3>
                        <Card
                            className={cn(
                                "overflow-hidden aspect-[4/3] relative group outline-dashed outline-2 outline-gray-300 border-none bg-gray-50",
                                photos.side ? "outline-primary outline-solid bg-transparent" : "hover:bg-gray-100"
                            )}
                            onClick={() => !photos.side && openCamera('side')}
                        >
                            {photos.side ? (
                                <>
                                    <img src={photos.side} alt="Side" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Button variant="outline" className="text-white border-white hover:bg-white/20" onClick={(e) => { e.stopPropagation(); retake('side'); }}>
                                            <RefreshCw className="mr-2 h-4 w-4" /> 撮り直し
                                        </Button>
                                    </div>
                                    <div className="absolute bottom-2 right-2 p-1 bg-green-500 rounded-full text-white shadow-sm">
                                        <Check size={14} strokeWidth={3} />
                                    </div>
                                </>
                            ) : (
                                <CardContent className="h-full flex flex-col items-center justify-center text-muted-foreground cursor-pointer">
                                    <Camera className="h-10 w-10 mb-2 opacity-50" />
                                    <span className="text-sm font-medium">タップして撮影</span>
                                </CardContent>
                            )}
                        </Card>
                    </div>

                    {/* Back Photo */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">B</span>
                            後ろから (Back)
                        </h3>
                        <Card
                            className={cn(
                                "overflow-hidden aspect-[4/3] relative group outline-dashed outline-2 outline-gray-300 border-none bg-gray-50",
                                photos.back ? "outline-primary bg-transparent" : "hover:bg-gray-100"
                            )}
                            onClick={() => !photos.back && openCamera('back')}
                        >
                            {photos.back ? (
                                <>
                                    <img src={photos.back} alt="Back" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Button variant="outline" className="text-white border-white hover:bg-white/20" onClick={(e) => { e.stopPropagation(); retake('back'); }}>
                                            <RefreshCw className="mr-2 h-4 w-4" /> 撮り直し
                                        </Button>
                                    </div>
                                    <div className="absolute bottom-2 right-2 p-1 bg-green-500 rounded-full text-white shadow-sm">
                                        <Check size={14} strokeWidth={3} />
                                    </div>
                                </>
                            ) : (
                                <CardContent className="h-full flex flex-col items-center justify-center text-muted-foreground cursor-pointer">
                                    <Camera className="h-10 w-10 mb-2 opacity-50" />
                                    <span className="text-sm font-medium">タップして撮影</span>
                                </CardContent>
                            )}
                        </Card>
                    </div>

                </div>

            </main>

            {/* Footer Button */}
            <div className="fixed bottom-0 w-full p-4 bg-white border-t border-border z-20">
                <Button
                    className="w-full text-lg h-12 shadow-md bg-gradient-to-r from-primary to-[#5C8D6D]"
                    disabled={!isComplete || isSaving}
                    onClick={handleSave}
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            アップロード中...
                        </>
                    ) : (
                        <>
                            <Upload className="mr-2 h-4 w-4" />
                            保存して完了
                        </>
                    )}
                </Button>
            </div>

        </div>
    );
}
