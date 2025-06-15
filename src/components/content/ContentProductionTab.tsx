
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, Calendar, CheckCircle } from 'lucide-react';
import { CampaignInfluencer, ContentSubmission } from '@/types/campaign';
import { contentSubmissionService } from '@/services/contentSubmission.service';
import ContentUploadModal from './ContentUploadModal';
import { useToast } from '@/hooks/use-toast';
import ProductionTimeline from './ProductionTimeline';
import InfluencerListItem from './InfluencerListItem';
import InfluencerDetailPanel from './InfluencerDetailPanel';

interface ContentProductionTabProps {
  campaignId: string;
  confirmedInfluencers: CampaignInfluencer[];
  onContentReviewReady: () => void;
}

const ContentProductionTab: React.FC<ContentProductionTabProps> = ({
  campaignId,
  confirmedInfluencers,
  onContentReviewReady
}) => {
  const [contentSubmissions, setContentSubmissions] = useState<ContentSubmission[]>([]);
  const [selectedInfluencerId, setSelectedInfluencerId] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedInfluencer, setSelectedInfluencer] = useState<CampaignInfluencer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadContentSubmissions();
  }, [campaignId]);

  // 첫 번째 인플루언서를 기본 선택
  useEffect(() => {
    if (confirmedInfluencers.length > 0 && !selectedInfluencerId) {
      setSelectedInfluencerId(confirmedInfluencers[0].id);
    }
  }, [confirmedInfluencers, selectedInfluencerId]);

  const loadContentSubmissions = async () => {
    try {
      setIsLoading(true);
      console.log('=== 콘텐츠 제출물 로딩 시작 ===');
      console.log('캠페인 ID:', campaignId);
      
      const submissions = await contentSubmissionService.getContentSubmissions(campaignId);
      setContentSubmissions(submissions);
      
      console.log('로딩된 제출물:', submissions.length, '개');
      console.log('=== 콘텐츠 제출물 로딩 완료 ===');
    } catch (error) {
      console.error('콘텐츠 제출물 로딩 실패:', error);
      toast({
        title: "로딩 실패",
        description: "콘텐츠 제출물을 불러오는데 실패했습니다.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadClick = (influencer: CampaignInfluencer) => {
    setSelectedInfluencer(influencer);
    setIsUploadModalOpen(true);
  };

  const handleUploadComplete = async (submissionData: Partial<ContentSubmission>) => {
    try {
      console.log('=== 콘텐츠 업로드 완료 처리 시작 ===');
      console.log('제출 데이터:', submissionData);

      await contentSubmissionService.createContentSubmission(campaignId, submissionData);
      
      // 제출물 목록 재로딩
      await loadContentSubmissions();
      
      setIsUploadModalOpen(false);
      setSelectedInfluencer(null);

      toast({
        title: "콘텐츠 업로드 완료",
        description: `${submissionData.influencerName}의 콘텐츠가 성공적으로 업로드되었습니다.`
      });

      console.log('=== 콘텐츠 업로드 완료 처리 완료 ===');
    } catch (error) {
      console.error('콘텐츠 업로드 실패:', error);
      toast({
        title: "업로드 실패",
        description: "콘텐츠 업로드에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const getInfluencerSubmission = (influencerId: string) => {
    return contentSubmissions.find(sub => sub.influencerId === influencerId);
  };

  const allContentSubmitted = confirmedInfluencers.every(inf => {
    const submission = getInfluencerSubmission(inf.id);
    return submission && submission.status !== 'draft';
  });

  const selectedInfluencerData = confirmedInfluencers.find(inf => inf.id === selectedInfluencerId);
  const selectedSubmission = selectedInfluencerId ? getInfluencerSubmission(selectedInfluencerId) : undefined;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <div className="text-lg">콘텐츠 제출 현황을 로딩 중...</div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mt-4"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* 제작 일정 현황 대시보드 */}
        <ProductionTimeline 
          confirmedInfluencers={confirmedInfluencers}
          contentSubmissions={contentSubmissions}
        />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                콘텐츠 제작 현황
              </div>
              <Badge variant={allContentSubmitted ? "default" : "secondary"}>
                {contentSubmissions.length}/{confirmedInfluencers.length} 제출완료
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                💡 시스템 관리자는 각 인플루언서의 콘텐츠를 업로드하고 제출할 수 있습니다. 
                모든 콘텐츠가 제출되면 콘텐츠 검수 단계로 전환할 수 있습니다.
              </p>
            </div>

            {/* 3칼럼 레이아웃 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 좌측: 인플루언서 목록 */}
              <div className="lg:col-span-1">
                <h3 className="text-sm font-medium text-gray-700 mb-3">인플루언서 목록</h3>
                <div className="space-y-2">
                  {confirmedInfluencers.map((influencer) => {
                    const submission = getInfluencerSubmission(influencer.id);
                    return (
                      <InfluencerListItem
                        key={influencer.id}
                        influencer={influencer}
                        submission={submission}
                        isSelected={selectedInfluencerId === influencer.id}
                        onClick={() => setSelectedInfluencerId(influencer.id)}
                      />
                    );
                  })}
                </div>
              </div>

              {/* 우측: 통합된 상세 정보 패널 */}
              <div className="lg:col-span-2">
                <h3 className="text-sm font-medium text-gray-700 mb-3">인플루언서 정보</h3>
                {selectedInfluencerData ? (
                  <InfluencerDetailPanel
                    influencer={selectedInfluencerData}
                    submission={selectedSubmission}
                    showUploadButton={true}
                    onUploadClick={handleUploadClick}
                  />
                ) : (
                  <Card>
                    <CardContent className="text-center py-12">
                      <p className="text-gray-500">인플루언서를 선택해주세요.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* 콘텐츠 검수 단계로 전환 버튼 */}
            {allContentSubmitted && (
              <div className="mt-6 pt-4 border-t">
                <Button 
                  onClick={onContentReviewReady}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  콘텐츠 검수 단계로 전환
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ContentUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          setSelectedInfluencer(null);
        }}
        influencer={selectedInfluencer}
        campaignId={campaignId}
        onUploadComplete={handleUploadComplete}
        existingSubmission={selectedInfluencer ? getInfluencerSubmission(selectedInfluencer.id) : undefined}
      />
    </>
  );
};

export default ContentProductionTab;
