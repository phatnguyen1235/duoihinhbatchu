// 'use client';
//
// import {useEffect, useState} from 'react';
// import Image from 'next/image';
// import {Button} from '@/components/ui/button';
// import {Input} from '@/components/ui/input';
// import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
// import {Badge} from '@/components/ui/badge';
// import Link from "next/link";
//
// const ADMIN_PASSWORD = 'admin123'; // Đổi mật khẩu tại đây
//
// interface Question {
//     id: string;
//     imageUrl: string;
//     answer: string;
//     hint: string | null;
//     category: string | null;
//     isActive: boolean;
// }
//
// export default function AdminQuestionsPage() {
//     const [isAuthenticated, setIsAuthenticated] = useState(false);
//     const [password, setPassword] = useState('');
//     const [passwordError, setPasswordError] = useState('');
//
//     const [questions, setQuestions] = useState<Question[]>([]);
//     const [loading, setLoading] = useState(true);
//     const [uploading, setUploading] = useState(false);
//
//     // Form state
//     const [newAnswer, setNewAnswer] = useState('');
//     const [newHint, setNewHint] = useState('');
//     const [newCategory, setNewCategory] = useState('');
//     const [selectedFile, setSelectedFile] = useState<File | null>(null);
//     const [previewUrl, setPreviewUrl] = useState<string | null>(null);
//
//     // Edit state
//     const [editingId, setEditingId] = useState<string | null>(null);
//     const [editAnswer, setEditAnswer] = useState('');
//     const [editHint, setEditHint] = useState('');
//     const [editCategory, setEditCategory] = useState('');
//     const [editFile, setEditFile] = useState<File | null>(null);
//     const [editPreviewUrl, setEditPreviewUrl] = useState<string | null>(null);
//
//     // Settings state
//     const [questionTime, setQuestionTime] = useState(30);
//     const [waitingTime, setWaitingTime] = useState(60);
//     const [totalRoundsSettings, setTotalRoundsSettings] = useState(5);
//     const [savingSettings, setSavingSettings] = useState(false);
//     const [currentPage, setCurrentPage] = useState(1);
//     const itemsPerPage = 10;
//
//
//
//     const fetchQuestions = async () => {
//         try {
//             const res = await fetch('/api/admin/questions');
//             const data = await res.json();
//             if (res.ok) {
//                 setQuestions(data.questions);
//             }
//         } catch (error) {
//             console.error('Fetch error:', error);
//         } finally {
//             setLoading(false);
//         }
//     };
//
//     const fetchSettings = async () => {
//         try {
//             const res = await fetch('/api/admin/settings');
//             const data = await res.json();
//             if (res.ok && data.settings) {
//                 setQuestionTime(data.settings.questionTime);
//                 setWaitingTime(data.settings.waitingTime);
//                 setTotalRoundsSettings(data.settings.totalRounds);
//             }
//         } catch (error) {
//             console.error('Fetch settings error:', error);
//         }
//     };
//
//
//
//     const handleSaveSettings = async () => {
//         setSavingSettings(true);
//         try {
//             const res = await fetch('/api/admin/settings', {
//                 method: 'PUT',
//                 headers: {'Content-Type': 'application/json'},
//                 body: JSON.stringify({
//                     questionTime,
//                     waitingTime,
//                     totalRounds: totalRoundsSettings,
//                 }),
//             });
//
//             if (res.ok) {
//                 alert('Đã lưu cài đặt!');
//             } else {
//                 alert('Lỗi khi lưu cài đặt');
//             }
//         } catch (error) {
//             console.error('Save settings error:', error);
//             alert('Lỗi khi lưu cài đặt');
//         } finally {
//             setSavingSettings(false);
//         }
//     };
//
//     // Check if already authenticated from session
//     useEffect(() => {
//         const savedAuth = sessionStorage.getItem('admin_authenticated');
//         if (savedAuth === 'true') {
//             setIsAuthenticated(true);
//         }
//     }, []);
//
//     useEffect(() => {
//         if (isAuthenticated) {
//             fetchQuestions();
//             fetchSettings();
//         }
//     }, [isAuthenticated]);
//
//     const handleLogin = (e: React.FormEvent) => {
//         e.preventDefault();
//         if (password === ADMIN_PASSWORD) {
//             setIsAuthenticated(true);
//             sessionStorage.setItem('admin_authenticated', 'true');
//             setPasswordError('');
//         } else {
//             setPasswordError('Mật khẩu không đúng!');
//         }
//     };
//
//     const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//         const file = e.target.files?.[0];
//         if (file) {
//             setSelectedFile(file);
//             setPreviewUrl(URL.createObjectURL(file));
//         }
//     };
//
//     const handleUpload = async (e: React.FormEvent) => {
//         e.preventDefault();
//         if (!selectedFile || !newAnswer.trim()) {
//             alert('Vui lòng chọn ảnh và nhập câu trả lời');
//             return;
//         }
//
//         setUploading(true);
//         const formData = new FormData();
//         formData.append('image', selectedFile);
//         formData.append('answer', newAnswer);
//         formData.append('hint', newHint);
//         formData.append('category', newCategory);
//
//         try {
//             const res = await fetch('/api/admin/questions', {
//                 method: 'POST',
//                 body: formData,
//             });
//
//             if (res.ok) {
//                 setNewAnswer('');
//                 setNewHint('');
//                 setNewCategory('');
//                 setSelectedFile(null);
//                 setPreviewUrl(null);
//                 fetchQuestions();
//             } else {
//                 const data = await res.json();
//                 alert(data.error || 'Lỗi khi tạo câu hỏi');
//             }
//         } catch (error) {
//             console.error('Upload error:', error);
//             alert('Lỗi khi upload');
//         } finally {
//             setUploading(false);
//         }
//     };
//
//     const handleEdit = (q: Question) => {
//         setEditingId(q.id);
//         setEditAnswer(q.answer);
//         setEditHint(q.hint || '');
//         setEditCategory(q.category || '');
//         setEditFile(null);
//         setEditPreviewUrl(null);
//     };
//
//     const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//         const file = e.target.files?.[0];
//         if (file) {
//             setEditFile(file);
//             setEditPreviewUrl(URL.createObjectURL(file));
//         }
//     };
//
//     const handleUpdate = async (id: string) => {
//         try {
//             let res;
//
//             if (editFile) {
//                 // If there's a new image, use FormData
//                 const formData = new FormData();
//                 formData.append('image', editFile);
//                 formData.append('answer', editAnswer);
//                 formData.append('hint', editHint);
//                 formData.append('category', editCategory);
//
//                 res = await fetch(`/api/admin/questions/${id}`, {
//                     method: 'PUT',
//                     body: formData,
//                 });
//             } else {
//                 // No new image, use JSON
//                 res = await fetch(`/api/admin/questions/${id}`, {
//                     method: 'PUT',
//                     headers: {'Content-Type': 'application/json'},
//                     body: JSON.stringify({
//                         answer: editAnswer,
//                         hint: editHint,
//                         category: editCategory,
//                     }),
//                 });
//             }
//
//             if (res.ok) {
//                 setEditingId(null);
//                 setEditFile(null);
//                 setEditPreviewUrl(null);
//                 fetchQuestions();
//             } else {
//                 const data = await res.json();
//                 alert(data.error || 'Lỗi khi cập nhật');
//             }
//         } catch (error) {
//             console.error('Update error:', error);
//         }
//     };
//
//     const handleToggleActive = async (id: string, currentActive: boolean) => {
//         try {
//             const res = await fetch(`/api/admin/questions/${id}`, {
//                 method: 'PUT',
//                 headers: {'Content-Type': 'application/json'},
//                 body: JSON.stringify({isActive: !currentActive}),
//             });
//
//             if (res.ok) {
//                 fetchQuestions();
//             }
//         } catch (error) {
//             console.error('Toggle error:', error);
//         }
//     };
//
//     const handleDelete = async (id: string) => {
//         if (!confirm('Bạn có chắc muốn xóa câu hỏi này?')) return;
//
//         try {
//             const res = await fetch(`/api/admin/questions/${id}`, {
//                 method: 'DELETE',
//             });
//
//             if (res.ok) {
//                 fetchQuestions();
//             } else {
//                 const data = await res.json();
//                 alert(data.error || 'Lỗi khi xóa');
//             }
//         } catch (error) {
//             console.error('Delete error:', error);
//         }
//     };
//     const indexOfLastItem = currentPage * itemsPerPage;
//     const indexOfFirstItem = indexOfLastItem - itemsPerPage;
//     const currentQuestions = questions.slice(indexOfFirstItem, indexOfLastItem);
//     const totalPages = Math.ceil(questions.length / itemsPerPage);
//
//     const handlePageChange = (pageNumber: number) => {
//         setCurrentPage(pageNumber);
//     };
//     // Login screen
//     if (!isAuthenticated) {
//         return (
//             <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
//                 <Card className="w-full max-w-sm">
//                     <CardHeader className="text-center">
//                         <CardTitle>Đăng nhập Admin</CardTitle>
//                         <p className="text-sm text-gray-500">Nhập mật khẩu để truy cập</p>
//                     </CardHeader>
//                     <CardContent>
//                         <form onSubmit={handleLogin} className="space-y-4">
//                             <div>
//                                 <Input
//                                     type="password"
//                                     placeholder="Nhập mật khẩu..."
//                                     value={password}
//                                     onChange={(e) => {
//                                         setPassword(e.target.value);
//                                         setPasswordError('');
//                                     }}
//                                     autoFocus
//                                 />
//                                 {passwordError && (
//                                     <p className="text-red-500 text-sm mt-2">{passwordError}</p>
//                                 )}
//                             </div>
//                             <div className="flex gap-2">
//                                 <Button asChild variant="outline" className="w-full flex-1">
//                                     <Link href="/">
//                                         ← Quay lại
//                                     </Link>
//                                 </Button>
//                                 <Button type="submit" className="flex-1">
//                                     Đăng nhập
//                                 </Button>
//                             </div>
//                         </form>
//                     </CardContent>
//                 </Card>
//             </main>
//         );
//     }
//
//     return (
//         <main className="min-h-screen bg-gray-50 p-4 md:p-8">
//             <div className="max-w-6xl mx-auto space-y-8">
//                 <div className="flex items-center justify-between">
//                     <div className="flex items-center gap-4">
//                         <Button asChild variant="outline" className="w-full flex-1">
//                             <Link href="/">
//                                 ← Quay lại
//                             </Link>
//                         </Button>
//                         <h1 className="text-3xl font-bold text-gray-800">Quản lý câu hỏi</h1>
//                     </div>
//                     <Badge variant="outline" className="text-lg">
//                         {questions.length} câu hỏi
//                     </Badge>
//                 </div>
//
//                 {/* Game Settings */}
//                 <Card>
//                     <CardHeader>
//                         <CardTitle>Cài đặt trò chơi</CardTitle>
//                     </CardHeader>
//                     <CardContent>
//                         {/* Chỉnh lại grid thành 2 cột thôi vì đã bỏ bớt 1 cái */}
//                         <div className="grid md:grid-cols-2 gap-6">
//
//                             {/* --- CỤM 1: THỜI GIAN TRẢ LỜI (Đã tách Phút - Giây) --- */}
//                             <div>
//                                 <label className="block text-sm font-medium mb-1">
//                                     Thời gian trả lời (Phút : Giây)
//                                 </label>
//                                 <div className="flex items-center gap-2">
//                                     {/* Ô nhập Phút */}
//                                     <div className="relative w-full">
//                                         <Input
//                                             type="number"
//                                             min="0"
//                                             placeholder="Phút"
//                                             value={Math.floor(questionTime / 60)} // Tự chia ra phút
//                                             onChange={(e) => {
//                                                 const newMin = Math.max(0, parseInt(e.target.value) || 0);
//                                                 const currentSec = questionTime % 60;
//                                                 setQuestionTime(newMin * 60 + currentSec); // Gom lại thành tổng giây
//                                             }}
//                                             className="pr-8" // Chừa chỗ cho chữ 'm'
//                                         />
//                                         <span
//                                             className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
//             m
//           </span>
//                                     </div>
//
//                                     <span className="font-bold text-gray-400">:</span>
//
//                                     {/* Ô nhập Giây */}
//                                     <div className="relative w-full">
//                                         <Input
//                                             type="number"
//                                             min="0"
//                                             max="59"
//                                             placeholder="Giây"
//                                             value={questionTime % 60} // Lấy phần lẻ giây
//                                             onChange={(e) => {
//                                                 let newSec = Math.max(0, parseInt(e.target.value) || 0);
//                                                 if (newSec > 59) newSec = 59; // Chặn không cho nhập quá 60s
//                                                 const currentMin = Math.floor(questionTime / 60);
//                                                 setQuestionTime(currentMin * 60 + newSec); // Gom lại thành tổng giây
//                                             }}
//                                             className="pr-8"
//                                         />
//                                         <span
//                                             className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
//             s
//           </span>
//                                     </div>
//                                 </div>
//                                 <p className="text-xs text-gray-500 mt-1">
//                                     Tổng cộng: {questionTime} giây/câu
//                                 </p>
//                             </div>
//
//                             {/* --- CỤM 2: ĐÃ XÓA "THỜI GIAN CHỜ" --- */}
//
//                             {/* --- CỤM 3: SỐ CÂU HỎI (Giữ nguyên) --- */}
//                             <div>
//                                 <label className="block text-sm font-medium mb-1">
//                                     Số câu hỏi mỗi người
//                                 </label>
//                                 <Input
//                                     type="number"
//                                     min="1"
//                                     max="20"
//                                     value={totalRoundsSettings}
//                                     onChange={(e) => setTotalRoundsSettings(Number(e.target.value))}
//                                 />
//                                 <p className="text-xs text-gray-500 mt-1">
//                                     Mỗi người chơi sẽ trả lời bấy nhiêu câu
//                                 </p>
//                             </div>
//                         </div>
//
//                         <Button
//                             className="mt-6 w-full md:w-auto"
//                             onClick={handleSaveSettings}
//                             disabled={savingSettings}
//                         >
//                             {savingSettings ? 'Đang lưu...' : 'Lưu cài đặt'}
//                         </Button>
//                     </CardContent>
//                 </Card>
//
//                 {/* QR Codes Management */}
//                 {/*<Card>*/}
//                 {/*    <CardHeader>*/}
//                 {/*        <CardTitle className="flex items-center justify-between">*/}
//                 {/*            <span>Quản lý mã tham gia</span>*/}
//                 {/*            <Badge variant="outline">{qrCodes.length} mã</Badge>*/}
//                 {/*        </CardTitle>*/}
//                 {/*    </CardHeader>*/}
//                 {/*    <CardContent>*/}
//                 {/*        <div className="grid md:grid-cols-2 gap-6">*/}
//                 {/*            /!* Add new codes *!/*/}
//                 {/*            <div>*/}
//                 {/*                <label className="block text-sm font-medium mb-2">*/}
//                 {/*                    Thêm mã mới (mỗi mã 1 dòng)*/}
//                 {/*                </label>*/}
//                 {/*                <textarea*/}
//                 {/*                    className="w-full h-32 p-2 border rounded-md text-sm font-mono"*/}
//                 {/*                    placeholder="CODE001&#10;CODE002&#10;CODE003"*/}
//                 {/*                    value={newCodes}*/}
//                 {/*                    onChange={(e) => setNewCodes(e.target.value)}*/}
//                 {/*                />*/}
//                 {/*                <div className="flex gap-2 mt-2">*/}
//                 {/*                    <Button*/}
//                 {/*                        onClick={handleAddCodes}*/}
//                 {/*                        disabled={addingCodes || !newCodes.trim()}*/}
//                 {/*                    >*/}
//                 {/*                        {addingCodes ? 'Đang thêm...' : 'Thêm mã'}*/}
//                 {/*                    </Button>*/}
//                 {/*                    <Button*/}
//                 {/*                        variant="outline"*/}
//                 {/*                        onClick={handleDeleteAllUnused}*/}
//                 {/*                    >*/}
//                 {/*                        Xóa mã chưa dùng*/}
//                 {/*                    </Button>*/}
//                 {/*                </div>*/}
//                 {/*            </div>*/}
//
//                 {/*            /!* Codes list *!/*/}
//                 {/*            <div>*/}
//                 {/*                <label className="block text-sm font-medium mb-2">*/}
//                 {/*                    Danh sách mã ({qrCodes.filter(c => c.playCount === 0).length} chưa dùng)*/}
//                 {/*                </label>*/}
//                 {/*                <div className="h-48 overflow-y-auto border rounded-md">*/}
//                 {/*                    {qrCodes.length === 0 ? (*/}
//                 {/*                        <p className="text-gray-500 text-sm p-4 text-center">Chưa có mã nào</p>*/}
//                 {/*                    ) : (*/}
//                 {/*                        <table className="w-full text-sm">*/}
//                 {/*                            <thead className="bg-gray-50 sticky top-0">*/}
//                 {/*                            <tr>*/}
//                 {/*                                <th className="px-2 py-1 text-left">Mã</th>*/}
//                 {/*                                <th className="px-2 py-1 text-center">Trạng thái</th>*/}
//                 {/*                                <th className="px-2 py-1 text-right">Thao tác</th>*/}
//                 {/*                            </tr>*/}
//                 {/*                            </thead>*/}
//                 {/*                            <tbody>*/}
//                 {/*                            {qrCodes.map((code) => (*/}
//                 {/*                                <tr key={code.id} className="border-t hover:bg-gray-50">*/}
//                 {/*                                    <td className="px-2 py-1 font-mono">{code.code}</td>*/}
//                 {/*                                    <td className="px-2 py-1 text-center">*/}
//                 {/*                                        {code.playCount > 0 ? (*/}
//                 {/*                                            <Badge variant="secondary">Đã dùng</Badge>*/}
//                 {/*                                        ) : (*/}
//                 {/*                                            <Badge variant="outline" className="text-green-600">Chưa*/}
//                 {/*                                                dùng</Badge>*/}
//                 {/*                                        )}*/}
//                 {/*                                    </td>*/}
//                 {/*                                    <td className="px-2 py-1 text-right">*/}
//                 {/*                                        <div className="flex gap-1 justify-end">*/}
//                 {/*                                            {code.playCount > 0 && (*/}
//                 {/*                                                <Button*/}
//                 {/*                                                    size="sm"*/}
//                 {/*                                                    variant="ghost"*/}
//                 {/*                                                    onClick={() => handleResetCode(code.id)}*/}
//                 {/*                                                    title="Reset để dùng lại"*/}
//                 {/*                                                >*/}
//                 {/*                                                    🔄*/}
//                 {/*                                                </Button>*/}
//                 {/*                                            )}*/}
//                 {/*                                            <Button*/}
//                 {/*                                                size="sm"*/}
//                 {/*                                                variant="ghost"*/}
//                 {/*                                                className="text-red-500"*/}
//                 {/*                                                onClick={() => handleDeleteCode(code.id)}*/}
//                 {/*                                            >*/}
//                 {/*                                                🗑️*/}
//                 {/*                                            </Button>*/}
//                 {/*                                        </div>*/}
//                 {/*                                    </td>*/}
//                 {/*                                </tr>*/}
//                 {/*                            ))}*/}
//                 {/*                            </tbody>*/}
//                 {/*                        </table>*/}
//                 {/*                    )}*/}
//                 {/*                </div>*/}
//                 {/*            </div>*/}
//                 {/*        </div>*/}
//                 {/*    </CardContent>*/}
//                 {/*</Card>*/}
//
//                 {/* Add new question form */}
//                 <Card>
//                     <CardHeader>
//                         <CardTitle>Thêm câu hỏi mới</CardTitle>
//                     </CardHeader>
//                     <CardContent>
//                         <form onSubmit={handleUpload} className="space-y-4">
//                             <div className="grid md:grid-cols-2 gap-4">
//                                 <div className="space-y-4">
//                                     <div>
//                                         <label className="block text-sm font-medium mb-1">Hình ảnh *</label>
//                                         <Input
//                                             type="file"
//                                             accept="image/*"
//                                             onChange={handleFileChange}
//                                             disabled={uploading}
//                                         />
//                                     </div>
//
//                                     {previewUrl && (
//                                         <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
//                                             <Image
//                                                 src={previewUrl}
//                                                 alt="Preview"
//                                                 fill
//                                                 className="object-contain"
//                                             />
//                                         </div>
//                                     )}
//                                 </div>
//
//                                 <div className="space-y-4">
//                                     <div>
//                                         <label className="block text-sm font-medium mb-1">Câu trả lời *</label>
//                                         <Input
//                                             placeholder="VD: Ăn quả nhớ kẻ trồng cây"
//                                             value={newAnswer}
//                                             onChange={(e) => setNewAnswer(e.target.value)}
//                                             disabled={uploading}
//                                         />
//                                     </div>
//
//                                     <div>
//                                         <label className="block text-sm font-medium mb-1">Gợi ý</label>
//                                         <Input
//                                             placeholder="VD: Lòng biết ơn"
//                                             value={newHint}
//                                             onChange={(e) => setNewHint(e.target.value)}
//                                             disabled={uploading}
//                                         />
//                                     </div>
//
//                                     <div>
//                                         <label className="block text-sm font-medium mb-1">Danh mục</label>
//                                         <Input
//                                             placeholder="VD: Ca dao, Tục ngữ"
//                                             value={newCategory}
//                                             onChange={(e) => setNewCategory(e.target.value)}
//                                             disabled={uploading}
//                                         />
//                                     </div>
//                                 </div>
//                             </div>
//
//                             <Button type="submit" disabled={uploading || !selectedFile}>
//                                 {uploading ? 'Đang tải...' : 'Thêm câu hỏi'}
//                             </Button>
//                         </form>
//                     </CardContent>
//                 </Card>
//
//                 {/* Questions list */}
//                 <Card>
//                     <CardHeader>
//                         <CardTitle>Danh sách câu hỏi</CardTitle>
//                     </CardHeader>
//                     <CardContent>
//                         {loading ? (
//                             <div className="text-center py-8">Đang tải...</div>
//                         ) : questions.length === 0 ? (
//                             <div className="text-center py-8 text-gray-500">
//                                 Chưa có câu hỏi nào
//                             </div>
//                         ) : (
//                             <div className="space-y-4">
//                                 {currentQuestions.map((q, index) => (
//                                     <div
//                                         key={q.id}
//                                         className={`flex flex-col md:flex-row gap-4 p-4 rounded-lg border ${
//                                             q.isActive ? 'bg-white' : 'bg-gray-100 opacity-60'
//                                         }`}>
//                                         <div className="flex-shrink-0 space-y-2">
//                                             <div
//                                                 className="relative w-full md:w-48 h-32 bg-gray-100 rounded-lg overflow-hidden">
//                                                 <Image
//                                                     src={editingId === q.id && editPreviewUrl ? editPreviewUrl : q.imageUrl}
//                                                     alt={`Câu ${index + 1}`}
//                                                     fill
//                                                     className="object-contain"
//                                                 />
//                                             </div>
//                                             {editingId === q.id && (
//                                                 <div>
//                                                     <Input
//                                                         type="file"
//                                                         accept="image/*"
//                                                         onChange={handleEditFileChange}
//                                                         className="text-xs"
//                                                     />
//                                                     <p className="text-xs text-gray-500 mt-1">Chọn ảnh mới (tùy
//                                                         chọn)</p>
//                                                 </div>
//                                             )}
//                                         </div>
//
//                                         <div className="flex-1 space-y-2">
//                                             {editingId === q.id ? (
//                                                 <div className="space-y-2">
//                                                     <div>
//                                                         <label className="text-xs text-gray-500">Câu trả lời *</label>
//                                                         <Input
//                                                             value={editAnswer}
//                                                             onChange={(e) => setEditAnswer(e.target.value)}
//                                                             placeholder="Câu trả lời"
//                                                         />
//                                                     </div>
//                                                     <div>
//                                                         <label className="text-xs text-gray-500">Gợi ý</label>
//                                                         <Input
//                                                             value={editHint}
//                                                             onChange={(e) => setEditHint(e.target.value)}
//                                                             placeholder="Gợi ý"
//                                                         />
//                                                     </div>
//                                                     <div>
//                                                         <label className="text-xs text-gray-500">Danh mục</label>
//                                                         <Input
//                                                             value={editCategory}
//                                                             onChange={(e) => setEditCategory(e.target.value)}
//                                                             placeholder="Danh mục"
//                                                         />
//                                                     </div>
//                                                     <div className="flex gap-2 pt-2">
//                                                         <Button size="sm" onClick={() => handleUpdate(q.id)}>
//                                                             Lưu
//                                                         </Button>
//                                                         <Button
//                                                             size="sm"
//                                                             variant="outline"
//                                                             onClick={() => {
//                                                                 setEditingId(null);
//                                                                 setEditFile(null);
//                                                                 setEditPreviewUrl(null);
//                                                             }}
//                                                         >
//                                                             Hủy
//                                                         </Button>
//                                                     </div>
//                                                 </div>
//                                             ) : (
//                                                 <>
//                                                     <div className="flex items-center gap-2">
//                                                         <span
//                                                             className="font-medium text-gray-500">  #{indexOfFirstItem + index + 1}        </span>
//                                                         <Badge variant={q.isActive ? 'default' : 'secondary'}>
//                                                             {q.isActive ? 'Hoạt động' : 'Ẩn'}
//                                                         </Badge>
//                                                         {q.category && (
//                                                             <Badge variant="outline">{q.category}</Badge>
//                                                         )}
//                                                     </div>
//                                                     <p className="font-medium text-lg">{q.answer}</p>
//                                                     {q.hint && (
//                                                         <p className="text-sm text-gray-500">Gợi ý: {q.hint}</p>
//                                                     )}
//                                                 </>
//                                             )}
//                                         </div>
//
//                                         {editingId !== q.id && (
//                                             <div className="flex md:flex-col gap-2">
//                                                 <Button
//                                                     size="sm"
//                                                     variant="outline"
//                                                     onClick={() => handleEdit(q)}
//                                                 >
//                                                     Sửa
//                                                 </Button>
//                                                 <Button
//                                                     size="sm"
//                                                     variant={q.isActive ? 'secondary' : 'default'}
//                                                     onClick={() => handleToggleActive(q.id, q.isActive)}
//                                                 >
//                                                     {q.isActive ? 'Ẩn' : 'Hiện'}
//                                                 </Button>
//                                                 <Button
//                                                     size="sm"
//                                                     variant="destructive"
//                                                     onClick={() => handleDelete(q.id)}
//                                                 >
//                                                     Xóa
//                                                 </Button>
//                                             </div>
//                                         )}
//
//                                     </div>
//                                 ))}
//                                 {questions.length > itemsPerPage && (
//                                     <div className="flex justify-center items-center gap-2 pt-4 mt-4 border-t">
//                                         <Button
//                                             variant="outline"
//                                             size="sm"
//                                             onClick={() => handlePageChange(currentPage - 1)}
//                                             disabled={currentPage === 1}
//                                         >
//                                             ← Trước
//                                         </Button>
//
//                                         <div className="flex gap-1">
//                                             {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
//                                                 <Button
//                                                     key={number}
//                                                     variant={currentPage === number ? "default" : "ghost"}
//                                                     size="sm"
//                                                     className="w-8 h-8 p-0"
//                                                     onClick={() => handlePageChange(number)}
//                                                 >
//                                                     {number}
//                                                 </Button>
//                                             ))}
//                                         </div>
//
//                                         <Button
//                                             variant="outline"
//                                             size="sm"
//                                             onClick={() => handlePageChange(currentPage + 1)}
//                                             disabled={currentPage === totalPages}
//                                         >
//                                             Sau →
//                                         </Button>
//                                     </div>
//                                 )}
//                             </div>
//
//                         )}
//
//                     </CardContent>
//                 </Card>
//             </div>
//         </main>
//     );
// }
'use client';

import {useEffect, useState} from 'react';
import Image from 'next/image';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import Link from "next/link";
import imageCompression from 'browser-image-compression';
const ADMIN_PASSWORD = 'admin123'; // Đổi mật khẩu tại đây

interface Question {
    id: string;
    imageUrl: string;
    answer: string;
    hint: string | null;
    category: string | null;
    isActive: boolean;
}

export default function AdminQuestionsPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');

    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    // Form state
    const [newAnswer, setNewAnswer] = useState('');
    const [newHint, setNewHint] = useState('');
    const [newCategory, setNewCategory] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // Edit state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editAnswer, setEditAnswer] = useState('');
    const [editHint, setEditHint] = useState('');
    const [editCategory, setEditCategory] = useState('');
    const [editFile, setEditFile] = useState<File | null>(null);
    const [editPreviewUrl, setEditPreviewUrl] = useState<string | null>(null);

    // Settings state
    const [questionTime, setQuestionTime] = useState(30);
    const [waitingTime, setWaitingTime] = useState(60);
    const [totalRoundsSettings, setTotalRoundsSettings] = useState(5);
    const [savingSettings, setSavingSettings] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const fetchQuestions = async () => {
        try {
            const res = await fetch('/api/admin/questions');
            const data = await res.json();
            if (res.ok) {
                setQuestions(data.questions);
            }
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/admin/settings');
            const data = await res.json();
            if (res.ok && data.settings) {
                setQuestionTime(data.settings.questionTime);
                setWaitingTime(data.settings.waitingTime);
                setTotalRoundsSettings(data.settings.totalRounds);
            }
        } catch (error) {
            console.error('Fetch settings error:', error);
        }
    };

    const handleSaveSettings = async () => {
        setSavingSettings(true);
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    questionTime,
                    waitingTime,
                    totalRounds: totalRoundsSettings,
                }),
            });

            if (res.ok) {
                alert('Đã lưu cài đặt!');
            } else {
                alert('Lỗi khi lưu cài đặt');
            }
        } catch (error) {
            console.error('Save settings error:', error);
            alert('Lỗi khi lưu cài đặt');
        } finally {
            setSavingSettings(false);
        }
    };

    // Check if already authenticated from session
    useEffect(() => {
        const savedAuth = sessionStorage.getItem('admin_authenticated');
        if (savedAuth === 'true') {
            setIsAuthenticated(true);
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            fetchQuestions();
            fetchSettings();
        }
    }, [isAuthenticated]);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === ADMIN_PASSWORD) {
            setIsAuthenticated(true);
            sessionStorage.setItem('admin_authenticated', 'true');
            setPasswordError('');
        } else {
            setPasswordError('Mật khẩu không đúng!');
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile || !newAnswer.trim()) {
            alert('Vui lòng chọn ảnh và nhập câu trả lời');
            return;
        }

        setUploading(true);

        try {
            // 1. Cấu hình nén
            const options = {
                maxSizeMB: 1,           // Nén xuống dưới 1MB
                maxWidthOrHeight: 1920, // Resize nếu quá to
                useWebWorker: true,
                fileType: 'image/jpeg'
            };

            // 2. Thực hiện nén (Quan trọng: phải await)
            console.log(`Ảnh gốc: ${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`);
            const compressedFile = await imageCompression(selectedFile, options);
            console.log(`Ảnh sau nén: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);

            // 3. Gửi file ĐÃ NÉN vào FormData
            const formData = new FormData();
            formData.append('image', compressedFile); // <-- Dùng compressedFile, không dùng selectedFile
            formData.append('answer', newAnswer);
            formData.append('hint', newHint);
            formData.append('category', newCategory);

            const res = await fetch('/api/admin/questions', {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                setNewAnswer('');
                setNewHint('');
                setNewCategory('');
                setSelectedFile(null);
                setPreviewUrl(null);
                fetchQuestions();
                alert('Thêm thành công!');
            } else {
                const data = await res.json();
                alert(data.error || 'Lỗi khi tạo câu hỏi');
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Lỗi khi upload');
        } finally {
            setUploading(false);
        }
    };

    const handleUpdate = async (id: string) => {
        try {
            let res;

            if (editFile) {
                // --- LOGIC NÉN CHO EDIT ---
                const options = {
                    maxSizeMB: 1,
                    maxWidthOrHeight: 1920,
                    useWebWorker: true,
                    fileType: 'image/jpeg'
                };

                // Nén file sửa đổi
                const compressedEditFile = await imageCompression(editFile, options);

                const formData = new FormData();
                formData.append('image', compressedEditFile); // <-- Gửi file nén
                formData.append('answer', editAnswer);
                formData.append('hint', editHint);
                formData.append('category', editCategory);

                res = await fetch(`/api/admin/questions/${id}`, {
                    method: 'PUT',
                    body: formData,
                });
            } else {
                // Không sửa ảnh thì gửi JSON như cũ
                res = await fetch(`/api/admin/questions/${id}`, {
                    method: 'PUT',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        answer: editAnswer,
                        hint: editHint,
                        category: editCategory,
                    }),
                });
            }

            if (res.ok) {
                setEditingId(null);
                setEditFile(null);
                setEditPreviewUrl(null);
                fetchQuestions();
            } else {
                const data = await res.json();
                alert(data.error || 'Lỗi khi cập nhật');
            }
        } catch (error) {
            console.error('Update error:', error);
        }
    };
    const handleEdit = (q: Question) => {
        setEditingId(q.id);
        setEditAnswer(q.answer);
        setEditHint(q.hint || '');
        setEditCategory(q.category || '');
        setEditFile(null);
        setEditPreviewUrl(null);
    };

    const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setEditFile(file);
            setEditPreviewUrl(URL.createObjectURL(file));
        }
    };

    // const handleUpdate = async (id: string) => {
    //     try {
    //         let res;
    //
    //         if (editFile) {
    //             // If there's a new image, use FormData
    //             const formData = new FormData();
    //             formData.append('image', editFile);
    //             formData.append('answer', editAnswer);
    //             formData.append('hint', editHint);
    //             formData.append('category', editCategory);
    //
    //             res = await fetch(`/api/admin/questions/${id}`, {
    //                 method: 'PUT',
    //                 body: formData,
    //             });
    //         } else {
    //             // No new image, use JSON
    //             res = await fetch(`/api/admin/questions/${id}`, {
    //                 method: 'PUT',
    //                 headers: {'Content-Type': 'application/json'},
    //                 body: JSON.stringify({
    //                     answer: editAnswer,
    //                     hint: editHint,
    //                     category: editCategory,
    //                 }),
    //             });
    //         }
    //
    //         if (res.ok) {
    //             setEditingId(null);
    //             setEditFile(null);
    //             setEditPreviewUrl(null);
    //             fetchQuestions();
    //         } else {
    //             const data = await res.json();
    //             alert(data.error || 'Lỗi khi cập nhật');
    //         }
    //     } catch (error) {
    //         console.error('Update error:', error);
    //     }
    // };

    const handleToggleActive = async (id: string, currentActive: boolean) => {
        try {
            const res = await fetch(`/api/admin/questions/${id}`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({isActive: !currentActive}),
            });

            if (res.ok) {
                fetchQuestions();
            }
        } catch (error) {
            console.error('Toggle error:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bạn có chắc muốn xóa câu hỏi này?')) return;

        try {
            const res = await fetch(`/api/admin/questions/${id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                fetchQuestions();
            } else {
                const data = await res.json();
                alert(data.error || 'Lỗi khi xóa');
            }
        } catch (error) {
            console.error('Delete error:', error);
        }
    };
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentQuestions = questions.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(questions.length / itemsPerPage);

    const handlePageChange = (pageNumber: number) => {
        setCurrentPage(pageNumber);
    };

    // Login screen
    if (!isAuthenticated) {
        return (
            // 👇 SỬA: Bỏ bg-gray-50 để hiện nền đỏ Layout
            <main className="min-h-screen flex items-center justify-center p-4">
                <Card className="w-full max-w-sm shadow-xl border-2 border-yellow-400">
                    <CardHeader className="text-center">
                        <CardTitle className="text-red-600 uppercase">Đăng nhập Admin</CardTitle>
                        <p className="text-sm text-gray-500">Nhập mật khẩu để truy cập</p>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <Input
                                    type="password"
                                    placeholder="Nhập mật khẩu..."
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        setPasswordError('');
                                    }}
                                    autoFocus
                                />
                                {passwordError && (
                                    <p className="text-red-500 text-sm mt-2">{passwordError}</p>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <Button asChild variant="outline" className="w-full flex-1 hover:bg-red-50">
                                    <Link href="/">
                                        ← Quay lại
                                    </Link>
                                </Button>
                                <Button type="submit" className="flex-1 bg-red-600 hover:bg-red-700 text-white">
                                    Đăng nhập
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </main>
        );
    }

    return (
        // 👇 SỬA: Bỏ bg-gray-50, nền giờ là trong suốt để lộ bg-tet-pattern bên dưới
        <main className="min-h-screen p-4 md:p-8 pb-32">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {/* Thêm bg-white cho nút quay lại để dễ nhìn trên nền đỏ */}
                        <Button asChild variant="outline" className="w-full flex-1 bg-white hover:bg-gray-100 border-yellow-400 text-red-700">
                            <Link href="/">
                                ← Quay lại
                            </Link>
                        </Button>
                        {/* Tiêu đề chữ trắng/vàng cho nổi bật */}
                        <h1 className="text-3xl font-bold text-white drop-shadow-md uppercase">Quản lý câu hỏi</h1>
                    </div>
                    {/* Badge nền trắng */}
                    <Badge variant="outline" className="text-lg bg-white text-red-600 border-yellow-400">
                        {questions.length} câu hỏi
                    </Badge>
                </div>

                {/* Game Settings */}
                <Card className="shadow-lg border-l-4 border-l-yellow-400">
                    <CardHeader>
                        <CardTitle className="text-red-700">Cài đặt trò chơi</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-2 gap-6">

                            {/* --- CỤM 1: THỜI GIAN TRẢ LỜI --- */}
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Thời gian trả lời (Phút : Giây)
                                </label>
                                <div className="flex items-center gap-2">
                                    <div className="relative w-full">
                                        <Input
                                            type="number"
                                            min="0"
                                            placeholder="Phút"
                                            value={Math.floor(questionTime / 60)}
                                            onChange={(e) => {
                                                const newMin = Math.max(0, parseInt(e.target.value) || 0);
                                                const currentSec = questionTime % 60;
                                                setQuestionTime(newMin * 60 + currentSec);
                                            }}
                                            className="pr-8"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">m</span>
                                    </div>

                                    <span className="font-bold text-gray-400">:</span>

                                    <div className="relative w-full">
                                        <Input
                                            type="number"
                                            min="0"
                                            max="59"
                                            placeholder="Giây"
                                            value={questionTime % 60}
                                            onChange={(e) => {
                                                let newSec = Math.max(0, parseInt(e.target.value) || 0);
                                                if (newSec > 59) newSec = 59;
                                                const currentMin = Math.floor(questionTime / 60);
                                                setQuestionTime(currentMin * 60 + newSec);
                                            }}
                                            className="pr-8"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">s</span>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Tổng cộng: {questionTime} giây/câu
                                </p>
                            </div>

                            {/* --- CỤM 3: SỐ CÂU HỎI --- */}
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Số câu hỏi mỗi người
                                </label>
                                <Input
                                    type="number"
                                    min="1"
                                    max="20"
                                    value={totalRoundsSettings}
                                    onChange={(e) => setTotalRoundsSettings(Number(e.target.value))}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Mỗi người chơi sẽ trả lời bấy nhiêu câu
                                </p>
                            </div>
                        </div>

                        <Button
                            className="mt-6 w-full md:w-auto bg-yellow-400 hover:bg-yellow-500 text-red-800 font-bold"
                            onClick={handleSaveSettings}
                            disabled={savingSettings}
                        >
                            {savingSettings ? 'Đang lưu...' : 'Lưu cài đặt'}
                        </Button>
                    </CardContent>
                </Card>

                {/* Add new question form */}
                <Card className="shadow-lg border-l-4 border-l-green-500">
                    <CardHeader>
                        <CardTitle className="text-green-700">Thêm câu hỏi mới</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleUpload} className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Hình ảnh *</label>
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            disabled={uploading}
                                        />
                                    </div>

                                    {previewUrl && (
                                        <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden border border-gray-300">
                                            <Image
                                                src={previewUrl}
                                                alt="Preview"
                                                fill
                                                className="object-contain"
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Câu trả lời *</label>
                                        <Input
                                            placeholder="VD: Ăn quả nhớ kẻ trồng cây"
                                            value={newAnswer}
                                            onChange={(e) => setNewAnswer(e.target.value)}
                                            disabled={uploading}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1">Gợi ý</label>
                                        <Input
                                            placeholder="VD: Lòng biết ơn"
                                            value={newHint}
                                            onChange={(e) => setNewHint(e.target.value)}
                                            disabled={uploading}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1">Danh mục</label>
                                        <Input
                                            placeholder="VD: Ca dao, Tục ngữ"
                                            value={newCategory}
                                            onChange={(e) => setNewCategory(e.target.value)}
                                            disabled={uploading}
                                        />
                                    </div>
                                </div>
                            </div>

                            <Button type="submit" disabled={uploading || !selectedFile} className="bg-green-600 hover:bg-green-700">
                                {uploading ? 'Đang tải...' : 'Thêm câu hỏi'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Questions list */}
                <Card className="shadow-lg border-t-4 border-t-blue-500">
                    <CardHeader>
                        <CardTitle className="text-blue-700">Danh sách câu hỏi</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center py-8">Đang tải...</div>
                        ) : questions.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                Chưa có câu hỏi nào
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {currentQuestions.map((q, index) => (
                                    <div
                                        key={q.id}
                                        className={`flex flex-col md:flex-row gap-4 p-4 rounded-lg border ${
                                            q.isActive ? 'bg-white border-green-200' : 'bg-gray-100 opacity-60 border-gray-200'
                                        } shadow-sm transition-all hover:shadow-md`}>
                                        <div className="flex-shrink-0 space-y-2">
                                            <div
                                                className="relative w-full md:w-48 h-32 bg-gray-50 rounded-lg overflow-hidden border">
                                                <Image
                                                    src={editingId === q.id && editPreviewUrl ? editPreviewUrl : q.imageUrl}
                                                    alt={`Câu ${index + 1}`}
                                                    fill
                                                    className="object-contain"
                                                />
                                            </div>
                                            {editingId === q.id && (
                                                <div>
                                                    <Input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleEditFileChange}
                                                        className="text-xs"
                                                    />
                                                    <p className="text-xs text-gray-500 mt-1">Chọn ảnh mới (tùy chọn)</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 space-y-2">
                                            {editingId === q.id ? (
                                                <div className="space-y-2">
                                                    <div>
                                                        <label className="text-xs text-gray-500">Câu trả lời *</label>
                                                        <Input
                                                            value={editAnswer}
                                                            onChange={(e) => setEditAnswer(e.target.value)}
                                                            placeholder="Câu trả lời"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-gray-500">Gợi ý</label>
                                                        <Input
                                                            value={editHint}
                                                            onChange={(e) => setEditHint(e.target.value)}
                                                            placeholder="Gợi ý"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-gray-500">Danh mục</label>
                                                        <Input
                                                            value={editCategory}
                                                            onChange={(e) => setEditCategory(e.target.value)}
                                                            placeholder="Danh mục"
                                                        />
                                                    </div>
                                                    <div className="flex gap-2 pt-2">
                                                        <Button size="sm" onClick={() => handleUpdate(q.id)} className="bg-blue-600 hover:bg-blue-700">
                                                            Lưu
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => {
                                                                setEditingId(null);
                                                                setEditFile(null);
                                                                setEditPreviewUrl(null);
                                                            }}
                                                        >
                                                            Hủy
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-gray-500">#{indexOfFirstItem + index + 1}</span>
                                                        <Badge variant={q.isActive ? 'default' : 'secondary'} className={q.isActive ? "bg-green-600 hover:bg-green-700" : ""}>
                                                            {q.isActive ? 'Hoạt động' : 'Ẩn'}
                                                        </Badge>
                                                        {q.category && (
                                                            <Badge variant="outline">{q.category}</Badge>
                                                        )}
                                                    </div>
                                                    <p className="font-medium text-lg text-gray-800">{q.answer}</p>
                                                    {q.hint && (
                                                        <p className="text-sm text-gray-500">Gợi ý: {q.hint}</p>
                                                    )}
                                                </>
                                            )}
                                        </div>

                                        {editingId !== q.id && (
                                            <div className="flex md:flex-col gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleEdit(q)}
                                                >
                                                    Sửa
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant={q.isActive ? 'secondary' : 'default'}
                                                    className={!q.isActive ? "bg-green-600 hover:bg-green-700" : ""}
                                                    onClick={() => handleToggleActive(q.id, q.isActive)}
                                                >
                                                    {q.isActive ? 'Ẩn' : 'Hiện'}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => handleDelete(q.id)}
                                                >
                                                    Xóa
                                                </Button>
                                            </div>
                                        )}

                                    </div>
                                ))}
                                {questions.length > itemsPerPage && (
                                    <div className="flex justify-center items-center gap-2 pt-4 mt-4 border-t">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className="bg-white"
                                        >
                                            ← Trước
                                        </Button>

                                        <div className="flex gap-1 bg-white p-1 rounded-md">
                                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                                                <Button
                                                    key={number}
                                                    variant={currentPage === number ? "default" : "ghost"}
                                                    size="sm"
                                                    className={`w-8 h-8 p-0 ${currentPage === number ? "bg-red-600 hover:bg-red-700" : ""}`}
                                                    onClick={() => handlePageChange(number)}
                                                >
                                                    {number}
                                                </Button>
                                            ))}
                                        </div>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                            className="bg-white"
                                        >
                                            Sau →
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}