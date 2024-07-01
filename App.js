import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import * as Battery from 'expo-battery';

export default function App() {
  const [batteryLevel, setBatteryLevel] = useState(0);
  const [isCharging, setIsCharging] = useState(false);
  const [incrementInterval, setIncrementInterval] = useState(6000); // default 6000ms for 1% change

  useEffect(() => {
    let subscription;
    let intervalId;
    let lastBatteryLevel;
    let lastTimestamp;

    const startMonitoring = async () => {
      const initialBatteryState = await Battery.getBatteryStateAsync();
      setIsCharging(initialBatteryState === Battery.BatteryState.CHARGING);

      subscription = Battery.addBatteryStateListener(({ batteryState }) => {
        setIsCharging(batteryState === Battery.BatteryState.CHARGING);
      });

      const updateBatteryLevel = async () => {
        const level = await Battery.getBatteryLevelAsync();
        setBatteryLevel(level * 100);
      };

      const measureChargeRate = async () => {
        lastBatteryLevel = await Battery.getBatteryLevelAsync();
        lastTimestamp = Date.now();

        setInterval(async () => {
          const currentLevel = await Battery.getBatteryLevelAsync();
          const currentTimestamp = Date.now();

          const levelDifference = currentLevel - lastBatteryLevel;
          const timeDifference = (currentTimestamp - lastTimestamp) / 1000; // in seconds

          if (levelDifference > 0) {
            const chargeRate = timeDifference / (levelDifference * 100); // seconds per 1%
            setIncrementInterval(chargeRate * 1000 / 100); // interval for 0.01%
          }

          lastBatteryLevel = currentLevel;
          lastTimestamp = currentTimestamp;
        }, 60000); // measure every minute
      };

      const simulateBatteryIncrement = () => {
        setBatteryLevel(prevLevel => {
          let newLevel = prevLevel + 0.01;
          if (newLevel > 100) {
            newLevel = 100;
          }
          return newLevel;
        });
      };

      await updateBatteryLevel();
      intervalId = setInterval(simulateBatteryIncrement, incrementInterval);

      await measureChargeRate();
    };

    startMonitoring();

    return () => {
      if (subscription) {
        subscription.remove();
      }
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [incrementInterval]);

  const handleReset = async () => {
    const level = await Battery.getBatteryLevelAsync();
    setBatteryLevel(level * 100);
  };

  return (
    <View style={styles.container}>
      {isCharging ? (
        <Text style={styles.chargingText}>
          Charging: {batteryLevel.toFixed(2)}%
        </Text>
      ) : (
        <Text style={styles.notChargingText}>
          Not charging. Please connect your charger.
        </Text>
      )}
      <Button style={styles.but} title="Reset" onPress={handleReset} />
    </View>
  );
}

const styles = StyleSheet.create({
  but: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
    color: 'green',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  chargingText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'green',
  },
  notChargingText: {
    fontSize: 18,
    color: 'red',
  },
});
