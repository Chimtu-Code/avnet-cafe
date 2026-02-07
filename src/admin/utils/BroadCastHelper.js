// broadcastHelper.js
// Add this file to your project and import it in your admin panel

import { supabase } from "../../services/supabaseClient";

/**
 * Broadcast menu change notification to all connected users
 * Call this after adding/updating/deleting menu items or categories
 */
export const broadcastMenuUpdate = async () => {
  try {
    const channel = supabase.channel('menu-updates');
    
    await channel.send({
      type: 'broadcast',
      event: 'menu-changed',
      payload: { timestamp: new Date().toISOString() }
    });

    console.log('Menu update broadcast sent successfully');
    return { success: true };
  } catch (error) {
    console.error('Error broadcasting menu update:', error);
    return { success: false, error };
  }
};

/**
 * Broadcast restaurant status change (open/closed)
 * Call this when toggling restaurant open/closed status
 */
export const broadcastStatusUpdate = async () => {
  try {
    const channel = supabase.channel('menu-updates');
    
    await channel.send({
      type: 'broadcast',
      event: 'status-changed',
      payload: { timestamp: new Date().toISOString() }
    });

    console.log('Status update broadcast sent successfully');
    return { success: true };
  } catch (error) {
    console.error('Error broadcasting status update:', error);
    return { success: false, error };
  }
};

/**
 * Example: How to use in your admin panel
 */

// Example 1: After adding a new menu item
/*
const handleAddItem = async (itemData) => {
  // Add item to database
  const { data, error } = await supabase
    .from('items')
    .insert(itemData);
  
  if (!error) {
    // Broadcast the change to all users
    await broadcastMenuUpdate();
  }
};
*/

// Example 2: After updating item availability
/*
const handleToggleAvailability = async (itemId, newStatus) => {
  // Update database
  const { error } = await supabase
    .from('items')
    .update({ avaliable: newStatus })
    .eq('id', itemId);
  
  if (!error) {
    // Broadcast the change
    await broadcastMenuUpdate();
  }
};
*/

// Example 3: After toggling restaurant open/closed
/*
const handleToggleRestaurant = async (isOpen) => {
  // Update database
  const { error } = await supabase
    .from('restaurant_settings')
    .update({ is_open: isOpen })
    .eq('id', 1);
  
  if (!error) {
    // Broadcast the status change
    await broadcastStatusUpdate();
  }
};
*/

// Example 4: After deleting a category
/*
const handleDeleteCategory = async (categoryId) => {
  // Delete from database
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', categoryId);
  
  if (!error) {
    // Broadcast the change
    await broadcastMenuUpdate();
  }
};
*/