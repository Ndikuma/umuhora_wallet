
import {NextResponse} from 'next/server';
import fs from 'fs-extra';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
fs.ensureDirSync(DATA_DIR);

async function saveData(filePath: string, data: any) {
  try {
    await fs.writeJson(filePath, {data, timestamp: Date.now()}, {spaces: 2});
    return {success: true};
  } catch (error) {
    console.error(`Failed to save data to ${filePath}:`, error);
    return {success: false, error: (error as Error).message};
  }
}

async function readData(filePath: string) {
  try {
    if (await fs.pathExists(filePath)) {
      return await fs.readJson(filePath);
    }
    return null;
  } catch (error) {
    console.error(`Failed to read data from ${filePath}:`, error);
    return null;
  }
}

const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

export async function GET() {
  const priceFilePath = path.join(DATA_DIR, 'crypto-price.json');
  const chartFilePath = path.join(DATA_DIR, 'crypto-chart.json');

  const cachedPrice = await readData(priceFilePath);
  const cachedChart = await readData(chartFilePath);

  if (
    cachedPrice &&
    cachedChart &&
    Date.now() - cachedPrice.timestamp < CACHE_DURATION
  ) {
    return NextResponse.json({
      success: true,
      data: {price: cachedPrice.data, chart: cachedChart.data},
    });
  }

  try {
    // Fetch both endpoints concurrently
    const [priceResponse, chartResponse] = await Promise.all([
      fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true'
      ),
      fetch(
        'https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=7&interval=daily'
      ),
    ]);

    if (!priceResponse.ok) {
      throw new Error(
        `Failed to fetch price from CoinGecko: ${priceResponse.statusText}`
      );
    }
    if (!chartResponse.ok) {
      throw new Error(
        `Failed to fetch chart from CoinGecko: ${chartResponse.statusText}`
      );
    }

    const priceData = await priceResponse.json();
    const chartData = await chartResponse.json();

    // Save new data
    await saveData(priceFilePath, priceData);
    await saveData(chartFilePath, chartData);

    return NextResponse.json({
      success: true,
      data: {price: priceData, chart: chartData},
    });
  } catch (error: any) {
    console.error('API fetch error:', error.message);
    // If fetching fails, serve stale data if available
    if (cachedPrice && cachedChart) {
      console.warn('Serving stale data due to API error.');
      return NextResponse.json({
        success: true,
        data: {price: cachedPrice.data, chart: cachedChart.data},
        stale: true,
      });
    }
    return NextResponse.json({error: error.message}, {status: 500});
  }
}
