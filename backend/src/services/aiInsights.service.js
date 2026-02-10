import mongoose from "mongoose";
import { Order } from "../models/Order.js";
import { Shop } from "../models/Shop.js";

/**
 * Aggregate sales data for seller's shops (last 30 days, completed orders).
 */
export async function getSalesSummaryForSeller(clerkUserId) {
  const shopIds = await Shop.find({
    sellerClerkUserId: clerkUserId,
    aiPremiumEnabled: true,
  })
    .distinct("_id")
    .lean();

  if (shopIds.length === 0) {
    return { orderCount: 0, totalLkr: 0, topItems: [], ordersByDay: [] };
  }

  const objectIds = shopIds.map((id) => new mongoose.Types.ObjectId(id));
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const [orderStats, topItems, ordersByDay] = await Promise.all([
    Order.aggregate([
      {
        $match: {
          shopId: { $in: objectIds },
          status: "COMPLETED",
          createdAt: { $gte: since },
        },
      },
      {
        $group: {
          _id: null,
          orderCount: { $sum: 1 },
          totalLkr: { $sum: "$subtotalLkr" },
        },
      },
    ]),
    Order.aggregate([
      {
        $match: {
          shopId: { $in: objectIds },
          status: "COMPLETED",
          createdAt: { $gte: since },
        },
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.nameSnapshot",
          qty: { $sum: "$items.qty" },
          revenueLkr: { $sum: "$items.lineTotalLkr" },
        },
      },
      { $sort: { qty: -1 } },
      { $limit: 10 },
      {
        $project: {
          name: "$_id",
          qty: 1,
          revenueLkr: 1,
          _id: 0,
        },
      },
    ]),
    Order.aggregate([
      {
        $match: {
          shopId: { $in: objectIds },
          status: "COMPLETED",
          createdAt: { $gte: since },
        },
      },
      {
        $group: {
          _id: { $dayOfWeek: "$createdAt" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const stats = orderStats[0] || { orderCount: 0, totalLkr: 0 };
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const ordersByDayNamed = ordersByDay.map((d) => ({
    day: dayNames[d._id - 1] || String(d._id),
    count: d.count,
  }));

  return {
    orderCount: stats.orderCount,
    totalLkr: stats.totalLkr,
    topItems,
    ordersByDay: ordersByDayNamed,
    periodDays: 30,
  };
}

/**
 * Call OpenAI to generate short insights from sales summary. Falls back to static tips if no key.
 */
export async function generateInsightsFromSales(summary, logger) {
  const apiKey = process.env.OPENAI_API_KEY;
  const hasData = summary.orderCount > 0;

  if (!apiKey) {
    return getFallbackInsights(summary, hasData);
  }

  const prompt = `You are a business advisor for a Sri Lankan Rice & Curry home kitchen (university marketplace). Based on this sales data from the last ${summary.periodDays} days, give 3–4 short, actionable insights or recommendations. Be concise; use simple language. Reply with a JSON array of strings, e.g. ["Insight 1", "Insight 2"].

Sales data:
- Completed orders: ${summary.orderCount}
- Total revenue (LKR): ${summary.totalLkr}
- Top selling items: ${JSON.stringify(summary.topItems?.slice(0, 5) || [])}
- Orders by day of week: ${JSON.stringify(summary.ordersByDay || [])}

Reply only with the JSON array, no other text.`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5,
        max_tokens: 400,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      logger?.warn({ status: res.status, body: errText }, "OpenAI API error");
      return getFallbackInsights(summary, hasData);
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content?.trim();
    if (!content) return getFallbackInsights(summary, hasData);

    // Parse JSON array from response (handle optional markdown code block)
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const arr = JSON.parse(jsonMatch[0]);
      if (Array.isArray(arr) && arr.length > 0) {
        return arr.filter((s) => typeof s === "string" && s.length > 0);
      }
    }
  } catch (err) {
    logger?.warn({ err }, "AI insights generation failed");
  }

  return getFallbackInsights(summary, hasData);
}

function getFallbackInsights(summary, hasData) {
  if (!hasData) {
    return [
      "Complete more orders to get personalised insights.",
      "Add your most popular rice and curry combos to the menu.",
      "Use flash deals to attract new customers.",
    ];
  }
  const tips = [
    `You had ${summary.orderCount} completed orders in the last 30 days.`,
    `Total revenue LKR ${summary.totalLkr?.toLocaleString()}. Consider setting a weekly target.`,
  ];
  if (summary.topItems?.length > 0) {
    const top = summary.topItems[0];
    tips.push(`"${top.name}" is your top seller (${top.qty} sold). Highlight it in deals or descriptions.`);
  }
  if (summary.ordersByDay?.length > 0) {
    const busy = summary.ordersByDay.reduce((a, b) => (b.count > (a?.count ?? 0) ? b : a), null);
    if (busy) tips.push(`Busiest day: ${busy.day}. Plan stock and prep for that day.`);
  }
  return tips;
}
