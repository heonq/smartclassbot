# Circlue.ai 데이터베이스 ERD (Entity Relationship Diagram)

## 전체 ERD

```mermaid
erDiagram
    users ||--o{ user_sessions : has
    users ||--o{ brands : owns
    users ||--o{ notifications : receives
    users ||--o{ audit_logs : performs
    users ||--o{ content_revisions : gives_feedback

    brands ||--o{ products : has
    brands ||--o{ campaigns : runs
    brands ||--o{ personas : creates
    brands ||--o{ settlements : has

    products ||--o{ campaigns : featured_in
    products ||--o{ personas : associated_with

    campaigns ||--|| campaign_target_content : has
    campaigns ||--o{ campaign_influencers : involves
    campaigns ||--o{ content_plans : contains
    campaigns ||--o{ content_submissions : contains
    campaigns ||--o{ performance_metrics : measured_by
    campaigns ||--o{ settlements : generates

    influencers ||--o{ campaign_influencers : participates_in
    influencers ||--o{ content_plans : creates
    influencers ||--o{ content_submissions : submits
    influencers ||--o{ performance_metrics : tracked_by

    content_submissions ||--o{ content_files : contains
    content_submissions ||--o{ content_revisions : has
    content_submissions ||--o{ performance_metrics : measured_by

    content_plans ||--o{ content_revisions : has

    performance_metrics ||--o{ comment_analysis : analyzed_by

    settlements ||--o{ tax_invoices : has
    settlements ||--o{ payments : has
```

## 사용자 관리 테이블 구조

```mermaid
erDiagram
    users {
        string id PK
        string email
        string password_hash
        string name
        string role
        boolean is_active
        datetime created_at
        datetime updated_at
    }

    user_sessions {
        string id PK
        string user_id FK
        string token
        datetime expires_at
        datetime created_at
    }

    users ||--o{ user_sessions : has
```

## 브랜드 관리 테이블 구조

```mermaid
erDiagram
    brands {
        string id PK
        string user_id FK
        string name
        text description
        string website
        text story
        string channels
        text marketing
        string social_channels
        string category
        string logo_url
        datetime created_at
        datetime updated_at
    }

    products {
        string id PK
        string brand_id FK
        string name
        text description
        string purchase_url
        string unit
        decimal price
        text ingredients
        text usage
        text effects
        text usp
        string target_gender
        string target_age
        string category
        string image_url
        datetime created_at
        datetime updated_at
    }

    brands ||--o{ products : has
```

## 인플루언서 관리 테이블 구조

```mermaid
erDiagram
    influencers {
        string id PK
        string name
        string real_name
        string category
        string platform
        string region
        int followers
        int avg_views
        int avg_likes
        int avg_comments
        decimal engagement_rate
        string profile_image_url
        string instagram_url
        string youtube_url
        string xiaohongshu_url
        string tiktok_url
        string douyin_url
        string weibo_url
        string bilibili_url
        decimal base_fee
        boolean is_active
        datetime created_at
        datetime updated_at
    }

    campaign_influencers {
        string id PK
        string campaign_id FK
        string influencer_id FK
        decimal proposed_fee
        decimal ad_fee
        string deliverables
        text additional_terms
        string status
        date production_start_date
        date production_deadline
        datetime created_at
        datetime updated_at
    }

    influencers ||--o{ campaign_influencers : participates_in
```

## 캠페인 관리 테이블 구조

```mermaid
erDiagram
    campaigns {
        string id PK
        string brand_id FK
        string product_id FK
        string title
        text description
        decimal budget
        date campaign_start_date
        date campaign_end_date
        date proposal_deadline
        string ad_type
        string status
        int current_stage
        datetime created_at
        datetime updated_at
    }

    campaign_target_content {
        string id PK
        string campaign_id FK
        string influencer_categories
        string target_age
        int usp_importance
        text influencer_impact
        text additional_description
        boolean secondary_content_usage
    }

    campaigns ||--|| campaign_target_content : has
```

## 페르소나 및 콘텐츠 관리

```mermaid
erDiagram
    personas {
        string id PK
        string brand_id FK
        string product_id FK
        string name
        string age
        string gender
        string interests
        string occupation
        text lifestyle
        text shopping_habits
        datetime created_at
        datetime updated_at
    }

    content_plans {
        string id PK
        string campaign_id FK
        string influencer_id FK
        string content_type
        string status
        jsonb plan_data
        int current_revision_number
        datetime created_at
        datetime updated_at
    }

    content_submissions {
        string id PK
        string campaign_id FK
        string influencer_id FK
        string content_type
        string status
        int current_revision_number
        string published_url
        datetime published_at
        datetime created_at
        datetime updated_at
    }

    content_files {
        string id PK
        string submission_id FK
        string file_url
        string file_type
        int file_size
        string thumbnail_url
        int duration
        datetime created_at
    }

    content_revisions {
        string id PK
        string content_plan_id FK
        string submission_id FK
        int revision_number
        text feedback
        string feedback_by FK
        string status
        jsonb revision_data
        datetime created_at
    }

    brands ||--o{ personas : generates
    content_submissions ||--o{ content_files : contains
    content_plans ||--o{ content_revisions : has
    content_submissions ||--o{ content_revisions : has
```

## 분석 및 정산 관리

```mermaid
erDiagram
    performance_metrics {
        string id PK
        string campaign_id FK
        string influencer_id FK
        string content_submission_id FK
        string platform
        date metric_date
        int views
        int likes
        int comments
        int shares
        int saves
        decimal engagement_rate
        decimal click_through_rate
        decimal conversion_rate
        decimal sales_amount
        datetime created_at
        datetime updated_at
    }

    comment_analysis {
        string id PK
        string performance_metric_id FK
        int total_comments
        int positive_comments
        int negative_comments
        int neutral_comments
        string key_topics
        decimal sentiment_score
        jsonb analysis_data
        datetime analyzed_at
    }

    settlements {
        string id PK
        string campaign_id FK
        string brand_id FK
        decimal amount
        string status
        date due_date
        datetime completed_at
        datetime created_at
        datetime updated_at
    }

    tax_invoices {
        string id PK
        string settlement_id FK
        string invoice_number
        string business_number
        string company_name
        string ceo_name
        text address
        string business_type
        string business_item
        decimal amount
        decimal tax_amount
        decimal total_amount
        date issued_date
        string file_url
        datetime created_at
    }

    payments {
        string id PK
        string settlement_id FK
        string payment_method
        string transaction_id
        decimal paid_amount
        datetime paid_at
        string receipt_url
        datetime created_at
    }

    performance_metrics ||--o{ comment_analysis : analyzed_by
    settlements ||--o{ tax_invoices : has
    settlements ||--o{ payments : has
```

## 시스템 관리 테이블

```mermaid
erDiagram
    audit_logs {
        string id PK
        string user_id FK
        string action
        string entity_type
        string entity_id
        jsonb old_values
        jsonb new_values
        string ip_address
        text user_agent
        datetime created_at
    }

    notifications {
        string id PK
        string user_id FK
        string type
        string title
        text message
        jsonb data
        boolean is_read
        datetime read_at
        datetime created_at
    }

    users ||--o{ audit_logs : generates
    users ||--o{ notifications : receives
```

## 주요 도메인별 관계도

### 1. 사용자 및 브랜드 관리

```mermaid
erDiagram
    users ||--o{ brands : "creates"
    brands ||--o{ products : "manufactures"
    brands ||--o{ campaigns : "runs"
    brands ||--o{ personas : "generates"

    users {
        string id PK
        string email
        string role
        boolean is_active
    }

    brands {
        string id PK
        string name
        string website
        string user_id FK
    }

    products {
        string id PK
        string brand_id FK
        string name
        decimal price
        string target_gender
    }
```

### 2. 캠페인 워크플로우

```mermaid
erDiagram
    campaigns ||--o{ campaign_influencers : invites
    campaign_influencers ||--o{ content_plans : creates
    campaign_influencers ||--o{ content_submissions : creates
    content_submissions ||--o{ content_files : contains
    campaigns ||--o{ performance_metrics : analyzed
    campaigns ||--o{ settlements : "generates bills"

    campaigns {
        string id PK
        string title
        string status
        decimal budget
        date campaign_start_date
        date campaign_end_date
    }

    campaign_influencers {
        string id PK
        string campaign_id FK
        string influencer_id FK
        string status
        decimal proposed_fee
    }

    content_submissions {
        string id PK
        string campaign_influencer_id FK
        string content_type
        string status
    }
```

### 3. 인플루언서 생태계

```mermaid
erDiagram
    influencers ||--o{ campaign_influencers : "participates in"
    campaign_influencers ||--o{ content_plans : produces
    campaign_influencers ||--o{ content_submissions : produces
    influencers ||--o{ performance_metrics : "metrics tracked"

    influencers {
        string id PK
        string name
        string platform
        int followers
        decimal engagement_rate
        string region
    }

    performance_metrics {
        string id PK
        string influencer_id FK
        date metric_date
        int views
        decimal engagement_rate
    }
```

### 4. 콘텐츠 및 성과 분석

```mermaid
erDiagram
    content_submissions ||--o{ content_files : "has files"
    content_submissions ||--o{ performance_metrics : "daily metrics"
    campaigns ||--o{ performance_metrics : "aggregated analytics"
    performance_metrics ||--o{ comment_analysis : "sentiment analysis"

    content_submissions {
        string id PK
        string platform
        string content_type
        string status
        datetime published_at
    }

    performance_metrics {
        string id PK
        string content_submission_id FK
        date metric_date
        int views
        int likes
        int comments
        decimal engagement_rate
    }

    comment_analysis {
        string id PK
        string performance_metric_id FK
        int total_comments
        decimal sentiment_score
    }
```

## 데이터 흐름도

```mermaid
flowchart TD
    A[브랜드 가입] --> B[브랜드 생성]
    B --> C[제품 등록]
    B --> D[페르소나 생성]

    C --> E[캠페인 생성]
    D --> E

    E --> F[인플루언서 매칭]
    F --> G[인플루언서 초대]
    G --> H{수락?}

    H -->|Yes| I[계약 체결]
    H -->|No| F

    I --> J[콘텐츠 제작]
    J --> K[콘텐츠 검수]
    K --> L{승인?}

    L -->|Yes| M[콘텐츠 발행]
    L -->|No| J

    M --> N[성과 모니터링]
    N --> O[분석 리포트]
    N --> P[정산 처리]

    style A fill:#f9f,stroke:#333,stroke-width:2px
    style E fill:#bbf,stroke:#333,stroke-width:2px
    style M fill:#bfb,stroke:#333,stroke-width:2px
```

## 상태 다이어그램

### 캠페인 상태 플로우

```mermaid
stateDiagram-v2
    [*] --> creating: 캠페인 생성
    creating --> submitted: 제출
    submitted --> recruiting: 인플루언서 모집
    recruiting --> proposing: 제안
    proposing --> revising: 수정 요청
    proposing --> confirmed: 확정
    revising --> confirmed: 수정 완료
    confirmed --> planning: 콘텐츠 기획
    planning --> producing: 제작
    producing --> content_review: 검토
    content_review --> producing: 수정 요청
    content_review --> live: 승인
    live --> monitoring: 모니터링
    monitoring --> completed: 완료
    completed --> [*]

    creating --> cancelled: 취소
    recruiting --> cancelled: 취소
    proposing --> cancelled: 취소
```

### 콘텐츠 상태 플로우

```mermaid
stateDiagram-v2
    [*] --> draft: 초안 작성
    draft --> submitted: 제출
    submitted --> approved: 승인
    submitted --> revision_requested: 수정 요청
    revision_requested --> submitted: 재제출
    approved --> published: 발행
    published --> [*]
```

## 주요 쿼리 패턴

### 1. 브랜드 대시보드 데이터

```mermaid
graph LR
    A[brands] --> B[campaigns]
    B --> C[campaign_influencers]
    B --> D[performance_metrics]
    C --> E[content_submissions]
    E --> F[content_files]

    style A fill:#f96,stroke:#333,stroke-width:2px
```

### 2. 인플루언서 검색 및 필터링

```mermaid
graph LR
    A[influencers] --> B[campaign_influencers]
    B --> C[campaigns]
    B --> D[content_submissions]
    D --> E[performance_metrics]

    style A fill:#f96,stroke:#333,stroke-width:2px
```

## 데이터베이스 인덱싱 전략

```mermaid
graph TD
    A[Primary Keys] --> B[UUID 자동 인덱스]

    C[Foreign Keys] --> D[참조 무결성 인덱스]

    E[Search Columns] --> F[users.email]
    E --> G[campaigns.status]
    E --> H[influencers.platform]

    I[Join Columns] --> J[brand_id in campaigns]
    I --> K[campaign_id in settlements]

    L[Date Columns] --> M[performance_metrics.metric_date]
    L --> N[campaigns.campaign_start_date]

    style A fill:#bbf,stroke:#333,stroke-width:2px
    style C fill:#bbf,stroke:#333,stroke-width:2px
    style E fill:#bfb,stroke:#333,stroke-width:2px
    style I fill:#bfb,stroke:#333,stroke-width:2px
    style L fill:#fbf,stroke:#333,stroke-width:2px
```
