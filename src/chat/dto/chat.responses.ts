export interface ChatMessageResponse {
  id: string;
  content: string;
  role: string;
  createdAt: Date;
  chatId?: string | null;
  fileId?: string | null;
  userId: string;
  generatedFiles: GeneratedFileResponse[];
}


// {
//   "answer": "根据2026年2月24日的销售数据，我为您整理了销量最高的10款菜品及其对应的销售额，并生成了柱状图。\n\n### 分析结论\n*   **销量冠军**：**高品质大串羔羊肉**以 **112份** 的销量位居榜首，销售额达到 **1460.57元**。\n*   **销售额冠军**：**老西安·牛肉泡馍（1.2两熟肉）**虽然销量排名第五（43份），但凭借较高的单价，贡献了最高的销售额 **1626.25元**。\n*   **核心单品**：**热汤·招牌刀削面**和**酥脆肉夹馍**表现均衡，不仅销量高（分别为42份和65份），销售额也均突破了1000元大关，是门店的流量与营收双重支柱。\n\n### 关键数据 (按销量降序)\n1.  **高品质大串羔羊肉**: 销量 112 | 销售额 1460.57元\n2.  **酥脆肉夹馍**: 销量 65 | 销售额 1025.42元\n3.  **秘制鸡翅**: 销量 47 | 销售额 560.93元\n4.  **秘制小排**: 销量 45 | 销售额 542.04元\n5.  **老西安·牛肉泡馍（1.2两熟肉）**: 销量 43 | 销售额 1626.25元\n6.  **热汤·招牌刀削面**: 销量 42 | 销售额 1095.60元\n7.  **蒜蓉烤乳山3-4两生蚝**: 销量 36 | 销售额 431.75元\n8.  **辣椒烤牛肉粒**: 销量 36 | 销售额 290.00元\n9.  **鱼豆腐**: 销量 35 | 销售额 179.95元\n10. **大串秘制牛大筋**: 销量 31 | 销售额 279.00元\n\n![2026年2月24日销量Top10菜品销售额统计](file-0ac14676-6e19-4dfc-b1f3-5c017203b2e3)\n\n***\n\n**您可能还想了解：**\n1. 销量前三的菜品在午餐和晚餐时段的销售表现有何差异？\n2. 像“老西安·牛肉泡馍”这样高客单价的单品，是否有搭配套餐销售的机会以进一步提升销量？\n3. 排名靠后的高销量低销售额产品（如鱼豆腐），是否可以通过组合营销来提升客单价？",
//   "generatedFiles": [
//       {
//           "id": "0ac14676-6e19-4dfc-b1f3-5c017203b2e3",
//           "fileType": "chart",
//           "mimeType": "image/png",
//           "filename": "0ac14676-6e19-4dfc-b1f3-5c017203b2e3_2026年2月24日销量Top10菜品销售额统计.png",
//           "path": "/Users/xiaoyuyin/Desktop/YXY_DEV/SME/sme-backend/generats/0ac14676-6e19-4dfc-b1f3-5c017203b2e3_2026年2月24日销量Top10菜品销售额统计.png",
//           "size": 76335
//       }
//   ]
// }

export interface ChatAnswerResponse {
  answer: string;
  generatedFiles: GeneratedFileResponse[];
}

export interface GeneratedFileResponse {
  id: string;
  fileType: string;
  mimeType: string;
  filename: string;
  path: string;
  url: string;
  size: number;
  createdAt?: Date;
  updatedAt?: Date;
  metadata?: unknown;
}