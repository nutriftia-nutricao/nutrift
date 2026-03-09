import React, { Component, ErrorInfo, ReactNode } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Colors } from "../constants/colors";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error("ErrorBoundary caught:", error, errorInfo);
    }
  }

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Algo deu errado</Text>
          <ScrollView style={styles.scroll}>
            <Text style={styles.message}>{this.state.error.message}</Text>
            {__DEV__ && this.state.error.stack && (
              <Text style={styles.stack}>{this.state.error.stack}</Text>
            )}
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 24,
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.error,
    marginBottom: 16,
  },
  scroll: {
    maxHeight: 300,
  },
  message: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 12,
  },
  stack: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontFamily: "monospace",
  },
});
