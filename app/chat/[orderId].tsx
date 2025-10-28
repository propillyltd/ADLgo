import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Image, Modal, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { Send, Phone, MoreVertical, MapPin, AlertCircle, XCircle, Camera, FileText } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

type Message = {
  id: string;
  sender_id: string;
  message: string;
  created_at: string;
  is_read: boolean;
};

type ChatPartner = {
  id: string;
  full_name: string;
  avatar_url: string;
  is_online: boolean;
};

export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [partner, setPartner] = useState<ChatPartner | null>(null);
  const [order, setOrder] = useState<any>(null);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadChatData();

    const subscription = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `order_id=eq.${params.orderId}`,
        },
        (payload: any) => {
          setMessages((prev) => [payload.new as Message, ...prev]);
          markMessageAsRead(payload.new.id);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadChatData = async () => {
    try {
      const { data: orderData } = await supabase
        .from('delivery_orders')
        .select('*')
        .eq('id', params.orderId)
        .maybeSingle();

      if (orderData) {
        setOrder(orderData);

        const partnerId = orderData.customer_id === user!.id
          ? orderData.partner_id
          : orderData.customer_id;

        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .eq('id', partnerId)
          .maybeSingle();

        const { data: partnerProfile } = await supabase
          .from('partner_profiles')
          .select('is_online')
          .eq('user_id', partnerId)
          .maybeSingle();

        if (profileData) {
          setPartner({
            ...profileData,
            is_online: partnerProfile?.is_online || false,
          });
        }
      }

      const { data: messagesData } = await supabase
        .from('messages')
        .select('*')
        .eq('order_id', params.orderId)
        .order('created_at', { ascending: false });

      if (messagesData) {
        setMessages(messagesData);
        messagesData.forEach((msg: any) => {
          if (msg.receiver_id === user!.id && !msg.is_read) {
            markMessageAsRead(msg.id);
          }
        });
      }
    } catch (error) {
      console.error('Error loading chat:', error);
    }
  };

  const markMessageAsRead = async (messageId: string) => {
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('id', messageId)
      .eq('receiver_id', user!.id);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !partner) return;

    try {
      const { error } = await supabase.from('messages').insert({
        order_id: params.orderId,
        sender_id: user!.id,
        receiver_id: partner.id,
        message: newMessage.trim(),
      });

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.sender_id === user!.id;

    return (
      <View style={[styles.messageContainer, isMyMessage && styles.myMessageContainer]}>
        <View style={[styles.messageBubble, isMyMessage && styles.myMessageBubble]}>
          <Text style={[styles.messageText, isMyMessage && styles.myMessageText]}>
            {item.message}
          </Text>
          <Text style={[styles.messageTime, isMyMessage && styles.myMessageTime]}>
            {new Date(item.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Image
            source={{
              uri: partner?.avatar_url || 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg'
            }}
            style={styles.headerAvatar}
          />
          <View>
            <Text style={styles.headerName}>{partner?.full_name || 'Loading...'}</Text>
            {partner?.is_online && (
              <View style={styles.onlineStatus}>
                <View style={styles.onlineDot} />
                <Text style={styles.onlineText}>Active now</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Phone size={20} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowActionsMenu(true)}
          >
            <MoreVertical size={20} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      {order && (
        <View style={styles.orderBanner}>
          <Text style={styles.orderBannerText}>
            Order #{order.order_number} • {order.delivery_type}
          </Text>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        inverted
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
      />

      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.attachButton}>
          <Text style={styles.attachButtonText}>+</Text>
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="Type your message..."
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
          maxLength={500}
        />

        <TouchableOpacity
          style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!newMessage.trim()}
        >
          <Send size={20} color={newMessage.trim() ? '#1a1a1a' : '#999'} />
        </TouchableOpacity>
      </View>

      <Modal
        visible={showActionsMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowActionsMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowActionsMenu(false)}
        >
          <View style={styles.actionsMenu}>
            <Text style={styles.actionsMenuTitle}>Delivery Actions</Text>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => {
                setShowActionsMenu(false);
                router.push(`/tracking/${params.orderId}`);
              }}
            >
              <MapPin size={20} color="#333" />
              <Text style={styles.actionItemText}>Track Location</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => {
                setShowActionsMenu(false);
                router.push(`/tracking/${params.orderId}`);
              }}
            >
              <FileText size={20} color="#333" />
              <Text style={styles.actionItemText}>View Order Details</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => {
                setShowActionsMenu(false);
                Alert.alert('Camera', 'Camera feature coming soon for delivery proof');
              }}
            >
              <Camera size={20} color="#333" />
              <Text style={styles.actionItemText}>Upload Delivery Proof</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => {
                setShowActionsMenu(false);
                Alert.alert('Report Issue', 'Issue reporting coming soon');
              }}
            >
              <AlertCircle size={20} color="#FF5252" />
              <Text style={[styles.actionItemText, { color: '#FF5252' }]}>Report Issue</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionItem, styles.actionItemCancel]}
              onPress={() => setShowActionsMenu(false)}
            >
              <XCircle size={20} color="#666" />
              <Text style={styles.actionItemText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    fontSize: 28,
    color: '#333',
    marginRight: 12,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  onlineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
  },
  onlineText: {
    fontSize: 12,
    color: '#666',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f9f9f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderBanner: {
    backgroundColor: '#FEF7E8',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  orderBannerText: {
    fontSize: 12,
    color: '#666',
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  myMessageContainer: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    maxWidth: '75%',
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    padding: 12,
  },
  myMessageBubble: {
    backgroundColor: '#FDB022',
  },
  messageText: {
    fontSize: 15,
    color: '#1a1a1a',
    marginBottom: 4,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#1a1a1a',
  },
  messageTime: {
    fontSize: 11,
    color: '#999',
  },
  myMessageTime: {
    color: 'rgba(0,0,0,0.6)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: 8,
  },
  attachButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f9f9f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachButtonText: {
    fontSize: 24,
    color: '#666',
  },
  input: {
    flex: 1,
    minHeight: 36,
    maxHeight: 100,
    backgroundColor: '#f9f9f9',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 15,
    color: '#1a1a1a',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FDB022',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#f9f9f9',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  actionsMenu: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  actionsMenuTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 20,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 12,
  },
  actionItemCancel: {
    borderBottomWidth: 0,
    marginTop: 8,
  },
  actionItemText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
});
