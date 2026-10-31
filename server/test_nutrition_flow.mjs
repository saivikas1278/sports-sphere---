import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const API_BASE = 'http://localhost:5000/api';

async function testNutritionFlow() {
  console.log('Testing Nutrition API Module Flow...');
  try {
    const timestamp = Date.now();
    // 1. Register test athlete
    const regRes = await axios.post(`${API_BASE}/auth/register`, {
      fullName: 'Nutrition Athlete',
      email: `nutrition_${timestamp}@test.com`,
      password: 'Password@123',
      role: 'player'
    });
    const token = regRes.data.token;
    console.log('Athlete registered successfully');

    const testDate = '2026-10-31';

    // 2. Fetch daily nutrition log (should return initial empty structure)
    const initialRes = await axios.get(`${API_BASE}/fitness/nutrition/daily?date=${testDate}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Initial daily log fetched, meals count:', initialRes.data.data?.meals?.length ?? -1);

    // 3. Add single meal item
    const mealRes = await axios.post(
      `${API_BASE}/fitness/nutrition/meal`,
      {
        date: testDate,
        meal: {
          name: 'Grilled Chicken Breast & Rice',
          mealType: 'lunch',
          calories: 450,
          protein: 42,
          carbs: 50,
          fat: 8
        }
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('Single meal added successfully, new meals count:', mealRes.data.data?.meals?.length);
    const addedMealId = mealRes.data.data?.meals?.[0]?._id;

    // 4. Save updated daily nutrition with water and goals
    const saveRes = await axios.post(
      `${API_BASE}/fitness/nutrition/daily`,
      {
        date: testDate,
        meals: [
          {
            name: 'Oatmeal & Protein Shake',
            mealType: 'breakfast',
            calories: 380,
            protein: 30,
            carbs: 45,
            fat: 6
          },
          {
            name: 'Grilled Chicken Breast & Rice',
            mealType: 'lunch',
            calories: 450,
            protein: 42,
            carbs: 50,
            fat: 8
          }
        ],
        waterIntake: 6,
        goals: {
          calories: 2400,
          protein: 180,
          carbs: 250,
          fat: 70,
          water: 10
        }
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('Full daily nutrition log saved successfully, water intake:', saveRes.data.data?.waterIntake);

    // 5. Query daily nutrition log to verify DB persistence
    const verifyRes = await axios.get(`${API_BASE}/fitness/nutrition/daily?date=${testDate}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const log = verifyRes.data.data;
    if (log && log.meals?.length === 2 && log.waterIntake === 6 && log.goals?.calories === 2400) {
      console.log('SUCCESS: Nutrition log persisted and verified in database!');
    } else {
      console.error('FAILURE: Persisted log does not match expected state:', log);
      process.exit(1);
    }

    // 6. Delete a meal item
    const mealToDeleteId = log.meals[0]._id;
    const deleteRes = await axios.delete(`${API_BASE}/fitness/nutrition/meal/${mealToDeleteId}?date=${testDate}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Meal deleted successfully, remaining meals count:', deleteRes.data.data?.meals?.length);

    if (deleteRes.data.data?.meals?.length === 1) {
      console.log('SUCCESS: Meal deletion verified cleanly!');
    } else {
      console.error('FAILURE: Meal deletion failed');
      process.exit(1);
    }

    console.log('--- ALL NUTRITION MODULE TESTS PASSED ---');
  } catch (err) {
    console.error('Test failed with error:', err.response?.data || err.message);
    process.exit(1);
  }
}

testNutritionFlow();
