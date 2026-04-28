export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { jd } = req.body;
  if (!jd) return res.status(400).json({ error: 'Missing JD content' });

  const PROFILE = `
【个人经历库】
1. 实习：凯捷中国 NLP算法实习生（2024.06-09，上海）
   - 使用 BERT 进行文本分类（准确率91%）
   - 独立完成命名实体识别(NER)模块，覆盖20+实体类型
   - 情感分析模型部署上线后响应时长缩短40%

2. 实习：某咨询公司数据分析实习生（2023.12-2024.03，北京）
   - 用 Python + SQL 对5个行业的销售数据进行清洗建模
   - 制作 Tableau 可视化仪表盘，支持客户战略决策
   - 独立撰写3份行业分析报告

3. 项目：浮游生物图像分类（2023.09-2024.01）
   - 使用 ResNet + 迁移学习，准确率94.3%

4. 获奖：泰迪杯全国数据挖掘大赛三等奖（2023.05）
   - 团队负责人，带领3人完成需求预测建模

技能：Python / PyTorch / SQL / Tableau / Excel / PPT
语言：英语 CET-6 (564)
`;

  const prompt = `你是一个专业的简历匹配分析师。根据以下岗位JD和候选人经历，进行详细的匹配分析。

【岗位JD】
${jd}

${PROFILE}

请严格按以下JSON格式返回，不要有任何其他文字：

{
  "overall_score": <0-100的整数>,
  "summary": "<2-3句话的总体评价>",
  "dimensions": [
    {"name": "<维度名称>", "score": <0-100整数>, "reason": "<15-30字说明>"},
    {"name": "<维度名称>", "score": <0-100整数>, "reason": "<15-30字说明>"},
    {"name": "<维度名称>", "score": <0-100整数>, "reason": "<15-30字说明>"},
    {"name": "<维度名称>", "score": <0-100整数>, "reason": "<15-30字说明>"}
  ],
  "matched_keywords": ["<词1>","<词2>","<词3>","<词4>","<词5>","<词6>"],
  "missing_keywords": ["<词1>","<词2>","<词3>","<词4>","<词5>"],
  "matched_experiences": [
    {"name": "<经历名称>", "relevance": "<高相关|相关|一般>", "reason": "<15-25字>"},
    {"name": "<经历名称>", "relevance": "<高相关|相关|一般>", "reason": "<15-25字>"},
    {"name": "<经历名称>", "relevance": "<高相关|相关|一般>", "reason": "<15-25字>"}
  ],
  "suggestions": [
    {"priority": "high", "content": "<具体建议20-40字>"},
    {"priority": "high", "content": "<具体建议20-40字>"},
    {"priority": "mid", "content": "<具体建议20-40字>"},
    {"priority": "low", "content": "<具体建议20-40字>"}
  ]
}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1200,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(500).json({ error: 'API error', detail: err });
    }

    const data = await response.json();
    const raw = data.content.map(b => b.text || '').join('');
    const clean = raw.replace(/```json|```/g, '').trim();
    const result = JSON.parse(clean);
    return res.status(200).json(result);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
