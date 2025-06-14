import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; // For icons like close, account, send
import { SafeAreaView } from 'react-native-safe-area-context'; // Import SafeAreaView

const EvaluacionPostJornadaScreen = () => {
  const [physicalTiredness, setPhysicalTiredness] = useState(0); // 1-5 rating
  const [mentalExhaustion, setMentalExhaustion] = useState(0); // 1-5 rating
  const [additionalComments, setAdditionalComments] = useState('');

  const handleRating = (type: 'physical' | 'mental', rating: number) => {
    if (type === 'physical') {
      setPhysicalTiredness(rating);
    } else {
      setMentalExhaustion(rating);
    }
  };

  const handleSubmit = () => {
    // Basic validation
    if (physicalTiredness === 0 || mentalExhaustion === 0) {
      console.log('Please rate your physical and mental state.');
      return;
    }

    const evaluationData = {
      physicalTiredness,
      mentalExhaustion,
      additionalComments,
      timestamp: new Date().toISOString(),
      user: 'John Smith', // Simulated user
    };

    console.log('Evaluación enviada:', evaluationData);
    // In a real application, you would send this data to your backend
    // and provide feedback to the user (e.g., a success message or navigate away).
    // Reset form after submission (optional)
    setPhysicalTiredness(0);
    setMentalExhaustion(0);
    setAdditionalComments('');
  };

  const renderRatingButtons = (type: 'physical' | 'mental', currentRating: number) => (
    <View style={styles.ratingButtonsContainer}>
      {[1, 2, 3, 4, 5].map((rating) => (
        <TouchableOpacity
          key={rating}
          style={[
            styles.ratingButton,
            currentRating === rating ? styles.ratingButtonActive : null,
          ]}
          onPress={() => handleRating(type, rating)}
        >
          <Text
            style={[
              styles.ratingButtonText,
              currentRating === rating ? styles.ratingButtonTextActive : null,
            ]}
          >
            {rating}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}> {/* Use SafeAreaView as the root container */}
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Post-Shift Check</Text>
        <TouchableOpacity onPress={() => console.log('Close button pressed')}>
          <Icon name="close" size={24} color="#000000" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollViewFlex} contentContainerStyle={styles.scrollViewContent}>
        {/* User Profile Section */}
        <View style={styles.userProfileCard}>
          <Icon name="account-circle" size={50} color="#000000" style={styles.profileAvatar} />
          <View>
            <Text style={styles.profileName}>John Smith</Text>
            <Text style={styles.profileDetails}>April 20, 2025 • Evening Shift</Text>
          </View>
        </View>

        {/* Physical Tiredness Section */}
        <View style={styles.questionCard}>
          <Text style={styles.questionText}>How physically tired are you?</Text>
          {renderRatingButtons('physical', physicalTiredness)}
          <View style={styles.ratingLabels}>
            <Text style={styles.ratingLabelText}>Not tired</Text>
            <Text style={styles.ratingLabelText}>Very tired</Text>
          </View>
        </View>

        {/* Mental Exhaustion Section */}
        <View style={styles.questionCard}>
          <Text style={styles.questionText}>How mentally exhausted are you?</Text>
          {renderRatingButtons('mental', mentalExhaustion)}
          <View style={styles.ratingLabels}>
            <Text style={styles.ratingLabelText}>Not exhausted</Text>
            <Text style={styles.ratingLabelText}>Very exhausted</Text>
          </View>
        </View>

        {/* Additional Comments Section */}
        <View style={styles.questionCard}>
          <Text style={styles.questionText}>Additional Comments</Text>
          <TextInput
            style={styles.commentsInput}
            placeholder="Share any concerns or notes about your shift..."
            placeholderTextColor="#666666"
            multiline
            numberOfLines={4}
            value={additionalComments}
            onChangeText={setAdditionalComments}
          />
        </View>
      </ScrollView>

      {/* Submit Assessment Button - Now part of the flex flow at the bottom */}
      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Icon name="send" size={24} color="#FFFFFF" style={styles.submitButtonIcon} />
        <Text style={styles.submitButtonText}>Submit Assessment</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1, // Make container take full height
    backgroundColor: '#F5F5F5', // Light grey background
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF', // White header background
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000', // Black title
  },
  scrollViewFlex: { // New style for ScrollView to take available space
    flex: 1,
  },
  scrollViewContent: {
    padding: 20,
    // paddingBottom will be handled by the button taking its own space at the bottom
    // No need for a large fixed paddingBottom here unless there's specific content that needs it
  },
  userProfileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileAvatar: {
    marginRight: 15,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  profileDetails: {
    fontSize: 14,
    color: '#666666',
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  questionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 15,
  },
  ratingButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  ratingButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0', // Light grey border
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', // White default background
  },
  ratingButtonActive: {
    backgroundColor: '#7ED321', // Lime green when active
    borderColor: '#7ED321', // Lime green border when active
  },
  ratingButtonText: {
    fontSize: 16,
    color: '#000000', // Black text by default
    fontWeight: 'bold',
  },
  ratingButtonTextActive: {
    color: '#FFFFFF', // White text when active
  },
  ratingLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
  },
  ratingLabelText: {
    fontSize: 12,
    color: '#666666',
  },
  commentsInput: {
    backgroundColor: '#F5F5F5', // Light grey background for input
    borderRadius: 8,
    padding: 15,
    minHeight: 100,
    textAlignVertical: 'top', // Aligns text to the top for multiline
    fontSize: 14,
    color: '#000000', // Black text input
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000', // Black button
    paddingVertical: 18,
    borderRadius: 0, // No rounded corners for full width bottom button
    // Removed position: 'absolute', bottom, left, right for normal flow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 }, // Shadow on top
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 8,
  },
  submitButtonIcon: {
    marginRight: 10,
  },
  submitButtonText: {
    color: '#FFFFFF', // White text
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default EvaluacionPostJornadaScreen;
