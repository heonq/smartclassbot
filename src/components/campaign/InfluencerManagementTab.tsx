
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { Check, X, Eye, Edit, Trash2, Users } from 'lucide-react';
import InfluencerDetailModal from '@/components/InfluencerDetailModal';
import XiaohongshuInfluencerDetailModal from '@/components/XiaohongshuInfluencerDetailModal';
import InfluencerEditModal from '@/components/campaign/InfluencerEditModal';
import SimilarInfluencerModal from '@/components/campaign/SimilarInfluencerModal';
import { Campaign, CampaignInfluencer } from '@/types/campaign';

interface InfluencerManagementTabProps {
  campaign: Campaign;
  onInfluencerApproval: (influencerId: string, approved: boolean) => void;
  onUpdateInfluencers: (influencers: CampaignInfluencer[]) => Promise<void>;
  toast: any;
}

interface EditFormData {
  adFee: string;
  region: string;
  category: string;
}

const InfluencerManagementTab: React.FC<InfluencerManagementTabProps> = ({
  campaign,
  onInfluencerApproval,
  onUpdateInfluencers,
  toast
}) => {
  const [selectedInfluencer, setSelectedInfluencer] = useState<CampaignInfluencer | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingInfluencer, setEditingInfluencer] = useState<CampaignInfluencer | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [similarInfluencerId, setSimilarInfluencerId] = useState<string | null>(null);
  const [isSimilarModalOpen, setIsSimilarModalOpen] = useState(false);
  const [influencerToDelete, setInfluencerToDelete] = useState<string | null>(null);

  const handleDetailView = (influencer: CampaignInfluencer) => {
    setSelectedInfluencer(influencer);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedInfluencer(null);
  };

  const handleEdit = (influencer: CampaignInfluencer) => {
    setEditingInfluencer(influencer);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingInfluencer(null);
  };

  const handleSaveEdit = async (updatedInfluencer: CampaignInfluencer, editData: EditFormData) => {
    try {
      const updatedInfluencerData = {
        ...updatedInfluencer,
        adFee: parseInt(editData.adFee.replace(/,/g, '')) || 0,
        region: editData.region,
        category: editData.category
      };
      
      const updatedInfluencers = campaign.influencers.map(inf => 
        inf.id === updatedInfluencer.id ? updatedInfluencerData : inf
      );
      
      await onUpdateInfluencers(updatedInfluencers);
      
      toast({
        title: "인플루언서 정보 수정 완료",
        description: "인플루언서 정보가 성공적으로 수정되었습니다."
      });
      
      handleCloseEditModal();
    } catch (error) {
      toast({
        title: "수정 실패",
        description: "인플루언서 정보 수정에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const handleViewSimilar = (influencerId: string) => {
    setSimilarInfluencerId(influencerId);
    setIsSimilarModalOpen(true);
  };

  const handleCloseSimilarModal = () => {
    setIsSimilarModalOpen(false);
    setSimilarInfluencerId(null);
  };

  const handleAddSimilarInfluencer = async (newInfluencer: CampaignInfluencer) => {
    try {
      const updatedInfluencers = [...campaign.influencers, newInfluencer];
      await onUpdateInfluencers(updatedInfluencers);
      
      toast({
        title: "인플루언서 추가 완료",
        description: "유사한 인플루언서가 성공적으로 추가되었습니다."
      });
      
      handleCloseSimilarModal();
    } catch (error) {
      toast({
        title: "추가 실패",
        description: "인플루언서 추가에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteInfluencer = async (influencerId: string) => {
    try {
      const updatedInfluencers = campaign.influencers.filter(inf => inf.id !== influencerId);
      await onUpdateInfluencers(updatedInfluencers);
      
      toast({
        title: "인플루언서 삭제 완료",
        description: "인플루언서가 성공적으로 삭제되었습니다."
      });
      
      setInfluencerToDelete(null);
    } catch (error) {
      toast({
        title: "삭제 실패",
        description: "인플루언서 삭제에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: CampaignInfluencer['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'admin-rejected': return 'bg-red-100 text-red-800';
      case 'brand-rejected': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: CampaignInfluencer['status']) => {
    switch (status) {
      case 'pending': return '대기중';
      case 'accepted': return '수락됨';
      case 'confirmed': return '승인됨';
      case 'rejected': return '거절됨';
      case 'admin-rejected': return '시스템 거절';
      case 'brand-rejected': return '브랜드 거절';
      default: return status;
    }
  };

  const handleInfluencerApproval = (influencerId: string, approved: boolean) => {
    console.log('=== InfluencerManagementTab 승인/거절 처리 시작 ===');
    console.log('인플루언서 ID:', influencerId);
    console.log('승인 여부:', approved);
    
    const influencer = campaign.influencers.find(inf => inf.id === influencerId);
    if (influencer) {
      console.log('승인 처리할 인플루언서:', influencer.name);
      console.log('현재 광고비:', influencer.adFee || influencer.proposedFee);
      console.log('현재 상태:', influencer.status);
    }
    
    onInfluencerApproval(influencerId, approved);
  };

  // 활성 상태의 인플루언서만 카운트 (거절된 인플루언서 제외)
  const getActiveInfluencersCount = () => {
    return campaign.influencers.filter(inf => 
      !['brand-rejected', 'admin-rejected', 'rejected'].includes(inf.status)
    ).length;
  };

  // 단계별 액션 버튼 렌더링 함수
  const renderActionButtons = (influencer: CampaignInfluencer) => {
    const isSubmittedOrRecruiting = campaign.status === 'submitted' || campaign.status === 'recruiting';
    const isProposingOrRevisionFeedback = campaign.status === 'proposing' || campaign.status === 'revision-feedback';

    return (
      <div className="flex items-center justify-end space-x-2">
        {/* 제출됨/섭외중 단계: 상세보기만 */}
        {isSubmittedOrRecruiting && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDetailView(influencer)}
          >
            <Eye className="w-3 h-3" />
          </Button>
        )}

        {/* 제안 단계 또는 제안수정피드백 단계: 광고비 표시, 승인/거절 버튼 */}
        {isProposingOrRevisionFeedback && influencer.status === 'accepted' && (
          <>
            <div className="text-sm font-medium text-green-600 mr-2">
              {(influencer.adFee || influencer.proposedFee || 0).toLocaleString()}원
            </div>
            <Button
              size="sm"
              onClick={() => handleInfluencerApproval(influencer.id, true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Check className="w-3 h-3 mr-1" />
              승인
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleInfluencerApproval(influencer.id, false)}
            >
              <X className="w-3 h-3 mr-1" />
              거절
            </Button>
          </>
        )}

        {/* 기타 단계에서는 상세보기만 */}
        {!isSubmittedOrRecruiting && !isProposingOrRevisionFeedback && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDetailView(influencer)}
          >
            <Eye className="w-3 h-3" />
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">선택된 인플루언서 ({getActiveInfluencersCount()}명)</h3>
      </div>

      {campaign.influencers.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          선택된 인플루언서가 없습니다.
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>인플루언서</TableHead>
                  <TableHead>플랫폼</TableHead>
                  <TableHead>카테고리</TableHead>
                  <TableHead>팔로워</TableHead>
                  <TableHead>참여율</TableHead>
                  <TableHead>협찬료</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead className="text-right">액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaign.influencers.map((influencer) => (
                  <TableRow key={influencer.id}>
                    <TableCell>
                      <img
                        src={influencer.profileImageUrl || influencer.profileImage}
                        alt={influencer.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{influencer.name}</div>
                        <div className="text-sm text-muted-foreground">@{influencer.name}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {(influencer.platform || 'douyin') === 'xiaohongshu' ? '샤오홍슈' : '더우인'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{influencer.category}</Badge>
                    </TableCell>
                    <TableCell>{influencer.followers.toLocaleString()}</TableCell>
                    <TableCell>{influencer.engagementRate}%</TableCell>
                    <TableCell>{(influencer.adFee || influencer.proposedFee || 0).toLocaleString()}원</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(influencer.status)}>
                        {getStatusText(influencer.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {renderActionButtons(influencer)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* 인플루언서 상세보기 모달 */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>인플루언서 상세정보</DialogTitle>
          </DialogHeader>
          {selectedInfluencer && (
            (selectedInfluencer.platform || 'douyin') === 'xiaohongshu' ? (
              <XiaohongshuInfluencerDetailModal
                influencer={{
                  ...selectedInfluencer,
                  profileImage: selectedInfluencer.profileImageUrl || selectedInfluencer.profileImage || '',
                  nickname: selectedInfluencer.name,
                  platform: (selectedInfluencer.platform || 'xiaohongshu') as 'xiaohongshu',
                  region: selectedInfluencer.region || '서울',
                  category: [selectedInfluencer.category]
                }}
              />
            ) : (
              <InfluencerDetailModal
                influencer={{
                  ...selectedInfluencer,
                  profileImage: selectedInfluencer.profileImageUrl || selectedInfluencer.profileImage || '',
                  nickname: selectedInfluencer.name,
                  platform: (selectedInfluencer.platform || 'douyin') as 'douyin',
                  region: selectedInfluencer.region || '서울',
                  category: [selectedInfluencer.category]
                }}
              />
            )
          )}
        </DialogContent>
      </Dialog>

      {/* 인플루언서 수정 모달 */}
      {editingInfluencer && (
        <InfluencerEditModal
          influencer={editingInfluencer}
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          onSave={handleSaveEdit}
        />
      )}

      {/* 유사 인플루언서 모달 */}
      {similarInfluencerId && (
        <SimilarInfluencerModal
          rejectedInfluencer={campaign.influencers.find(inf => inf.id === similarInfluencerId) || null}
          isOpen={isSimilarModalOpen}
          onClose={handleCloseSimilarModal}
          onAddInfluencers={async (influencers: CampaignInfluencer[]) => {
            const updatedInfluencers = [...campaign.influencers, ...influencers];
            await onUpdateInfluencers(updatedInfluencers);
          }}
        />
      )}

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={!!influencerToDelete} onOpenChange={() => setInfluencerToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>인플루언서 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 이 인플루언서를 캠페인에서 제거하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={() => influencerToDelete && handleDeleteInfluencer(influencerToDelete)}>
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default InfluencerManagementTab;
