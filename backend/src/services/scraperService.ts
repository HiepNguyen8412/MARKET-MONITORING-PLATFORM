import cron from 'node-cron';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { prisma } from '../index';

export function startScraperService() {
  console.log('Scraper service initialized. Scheduled to run every hour.');
  
  // Run immediately for testing, then set up the cron job
  // Change "0 * * * *" to "* * * * *" for every minute testing, or let it run hourly.
  cron.schedule('0 * * * *', async () => {
    console.log('Running automated scraping tasks...');
    await runAllScrapingTasks();
  });
}

export async function runAllScrapingTasks() {
  try {
    await scrapeGoldPrices();
    await scrapeBankRates();
    await scrapeMotorbikePrices();
  } catch (error) {
    console.error('Error in runAllScrapingTasks:', error);
  }
}

async function scrapeGoldPrices() {
  try {
    console.log('Scraping Gold Prices (Placeholder)...');
    // Placeholder logic for scraping SJC gold
    // const response = await axios.get('https://example.com/gold');
    // const $ = cheerio.load(response.data);
    // const priceText = $('.gold-price').text();
    // const price = parseFloat(priceText);
    
    const mockedPrice = 85000000 + Math.random() * 1000000;

    await prisma.scrapedMarketData.upsert({
      where: { itemName: 'SJC Gold' },
      update: {
        priceOrRate: mockedPrice,
        lastUpdated: new Date()
      },
      create: {
        category: 'GOLD',
        itemName: 'SJC Gold',
        priceOrRate: mockedPrice
      }
    });
    console.log('Gold prices successfully saved.');
  } catch (error) {
    console.error('Failed to scrape Gold Prices:', error);
  }
}

async function scrapeBankRates() {
  try {
    console.log('Scraping Bank Interest Rates (Placeholder)...');
    // Placeholder logic for MB Bank and Vietcombank
    // const response = await axios.get('https://example.com/bank-rates');
    // const $ = cheerio.load(response.data);
    
    const banks = [
      { name: 'MB Bank 12M', rate: 4.8 + Math.random() * 0.5 },
      { name: 'Vietcombank 12M', rate: 4.6 + Math.random() * 0.5 }
    ];

    for (const bank of banks) {
      await prisma.scrapedMarketData.upsert({
        where: { itemName: bank.name },
        update: {
          priceOrRate: bank.rate,
          lastUpdated: new Date()
        },
        create: {
          category: 'BANK_RATE',
          itemName: bank.name,
          priceOrRate: bank.rate
        }
      });
    }
    console.log('Bank rates successfully saved.');
  } catch (error) {
    console.error('Failed to scrape Bank Rates:', error);
  }
}

async function scrapeMotorbikePrices() {
  try {
    console.log('Scraping Motorbike Prices (Placeholder)...');
    
    const bikes = [
      { name: 'Honda Vision', price: 31000000 + Math.random() * 2000000 },
      { name: 'Honda Wave RSX', price: 22000000 + Math.random() * 1000000 }
    ];

    for (const bike of bikes) {
      await prisma.scrapedMarketData.upsert({
        where: { itemName: bike.name },
        update: {
          priceOrRate: bike.price,
          lastUpdated: new Date()
        },
        create: {
          category: 'MOTORBIKE',
          itemName: bike.name,
          priceOrRate: bike.price
        }
      });
    }
    console.log('Motorbike prices successfully saved.');
  } catch (error) {
    console.error('Failed to scrape Motorbike Prices:', error);
  }
}
