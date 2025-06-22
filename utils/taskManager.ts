/** @format */

import * as TaskManager from "expo-task-manager";

const BACKGROUND_FETCH_TASK = "background-fetch-task";

TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    // Votre logique de tâche en arrière-plan ici
    console.log("Background fetch task executed");
  } catch (error) {
    console.error("Background fetch task failed:", error);
  }
});

export const registerBackgroundFetchAsync = async () => {
  try {
    await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
    await TaskManager.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
  } catch (error) {
    console.log("Task not registered:", error);
  }

  try {
    await TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
      try {
        // Votre logique de tâche en arrière-plan ici
        console.log("Background fetch task executed");
      } catch (error) {
        console.error("Background fetch task failed:", error);
      }
    });
  } catch (error) {
    console.log("Task already defined:", error);
  }
};
