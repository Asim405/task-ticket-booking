import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { BarCodeScanner } from 'expo-barcode-scanner';

const API_BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:3001' : 'http://localhost:3001';

const qrUrl = ticket => {
  const payload = JSON.stringify({
    user_name: ticket.user_name,
    event: ticket.event,
    seat_no: ticket.seat_no,
  });

  return `https://chart.googleapis.com/chart?cht=qr&chs=220x220&chl=${encodeURIComponent(payload)}`;
};

const parseTicketQr = data => {
  try {
    return JSON.parse(data);
  } catch {
    return { raw: data };
  }
};

export default function App() {
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannedTickets, setScannedTickets] = useState([]);
  const [scanMessage, setScanMessage] = useState('Scan a ticket QR code to view booking details.');

  useEffect(() => {
    fetchTickets();
    requestCameraPermission();
  }, []);

  useEffect(() => {
    const normalizedQuery = searchText.trim().toLowerCase();
    const filtered = tickets.filter(ticket =>
      ticket.event.toLowerCase().includes(normalizedQuery)
    );
    setFilteredTickets(filtered);
  }, [searchText, tickets]);

  const requestCameraPermission = async () => {
    const { status } = await BarCodeScanner.requestPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/tickets`);
      const data = await response.json();
      setTickets(data);
    } catch (error) {
      console.error('Failed to load tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBarCodeScanned = ({ data }) => {
    setScannerOpen(false);
    const payload = parseTicketQr(data);

    if (payload.raw) {
      setScanMessage(`Scanned raw data: ${payload.raw}`);
      return;
    }

    const alreadyScanned = scannedTickets.some(
      ticket =>
        ticket.user_name === payload.user_name &&
        ticket.event === payload.event &&
        ticket.seat_no === payload.seat_no
    );

    if (!alreadyScanned) {
      setScannedTickets(prev => [...prev, payload]);
      setScanMessage(`Scanned ticket for ${payload.event} (${payload.seat_no})`);
    } else {
      setScanMessage(`Ticket already scanned: ${payload.event} (${payload.seat_no})`);
    }
  };

  const displayedTickets = searchText ? filteredTickets : tickets;
  const ticketsLeft = tickets.length - scannedTickets.length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.topBar}>
          <View>
            <Text style={styles.logo}>CINEMA TICKETS</Text>
            <Text style={styles.tagline}>Dark, dramatic mobile booking experience</Text>
          </View>
          <View style={styles.navRow}>
            <Text style={styles.navItem}>Home</Text>
            <Text style={styles.navItem}>My Tickets</Text>
            <Text style={styles.navItem}>Book Now</Text>
          </View>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Ticket Booking</Text>
          <Text style={styles.heroSubtitle}>Scan, search, and manage your cinema tickets in one place.</Text>
        </View>

        <View style={styles.searchBox}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by event name"
            placeholderTextColor="#888"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statsCard}>
            <Text style={styles.statsLabel}>Total Tickets</Text>
            <Text style={styles.statsValue}>{tickets.length}</Text>
          </View>
          <View style={styles.statsCard}> 
            <Text style={styles.statsLabel}>Booked</Text>
            <Text style={styles.statsValue}>{scannedTickets.length}</Text>
          </View>
          <View style={styles.statsCard}> 
            <Text style={styles.statsLabel}>Left</Text>
            <Text style={styles.statsValue}>{ticketsLeft >= 0 ? ticketsLeft : 0}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.scanButton} onPress={() => setScannerOpen(true)}>
          <Text style={styles.scanButtonText}>Open QR Scanner</Text>
        </TouchableOpacity>

        <Text style={styles.scanMessage}>{scanMessage}</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#f7f5f5" style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.cardsGrid}>
            {displayedTickets.map((ticket, index) => (
              <View key={`${ticket.seat_no}-${index}`} style={styles.ticketCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.ticketIcon}>🎫</Text>
                  <Text style={styles.ticketTitle}>{ticket.event}</Text>
                </View>
                <Text style={styles.ticketMeta}>Name</Text>
                <Text style={styles.ticketValue}>{ticket.user_name}</Text>
                <Text style={styles.ticketMeta}>Seat</Text>
                <Text style={styles.ticketValue}>{ticket.seat_no}</Text>
                <Image style={styles.qrImage} source={{ uri: qrUrl(ticket) }} />
              </View>
            ))}
          </View>
        )}

        {scannedTickets.length > 0 && (
          <View style={styles.scannedSection}>
            <Text style={styles.sectionTitle}>Scanned Tickets</Text>
            {scannedTickets.map((ticket, index) => (
              <View key={`${ticket.event}-scanned-${index}`} style={styles.scannedRow}>
                <Text style={styles.scannedText}>{ticket.event} — {ticket.seat_no}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal visible={scannerOpen} animationType="slide" transparent={false}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Scan Ticket QR Code</Text>
          <Text style={styles.modalHint}>Grant camera access and hold the QR code inside the frame.</Text>
          <View style={styles.scannerWrapper}>
            <BarCodeScanner
              onBarCodeScanned={handleBarCodeScanned}
              style={StyleSheet.absoluteFillObject}
            />
          </View>

          <TouchableOpacity style={styles.closeScannerButton} onPress={() => setScannerOpen(false)}>
            <Text style={styles.closeScannerText}>Close scanner</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#090909',
  },
  container: {
    padding: 18,
    paddingBottom: 40,
    backgroundColor: '#090909',
  },
  topBar: {
    marginBottom: 18,
  },
  logo: {
    color: '#f0dede',
    fontSize: 22,
    fontWeight: '900',
  },
  tagline: {
    color: '#bbb',
    marginTop: 4,
    fontSize: 13,
  },
  navRow: {
    flexDirection: 'row',
    marginTop: 14,
    justifyContent: 'space-between',
  },
  navItem: {
    color: '#fff',
    fontSize: 13,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 18,
    backgroundColor: '#1f1f1f',
  },
  heroCard: {
    borderRadius: 18,
    backgroundColor: '#111',
    padding: 18,
    marginBottom: 18,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
  },
  heroSubtitle: {
    color: '#ccc',
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
  },
  searchBox: {
    marginBottom: 14,
  },
  searchInput: {
    backgroundColor: '#121212',
    color: '#fff',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#222',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statsCard: {
    flex: 1,
    backgroundColor: '#121212',
    marginHorizontal: 4,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  statsLabel: {
    color: '#aaa',
    fontSize: 12,
    marginBottom: 6,
  },
  statsValue: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  scanButton: {
    marginBottom: 16,
    backgroundColor: '#625a5a',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  scanButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  scanMessage: {
    color: '#bbb',
    fontSize: 13,
    marginBottom: 18,
    textAlign: 'center',
  },
  cardsGrid: {
    gap: 14,
  },
  ticketCard: {
    backgroundColor: '#0f0f0f',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#232323',
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ticketIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  ticketTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  ticketMeta: {
    color: '#888',
    marginTop: 10,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  ticketValue: {
    color: '#fff',
    fontSize: 16,
    marginTop: 4,
  },
  qrImage: {
    width: 140,
    height: 140,
    marginTop: 18,
    alignSelf: 'center',
    borderRadius: 14,
    backgroundColor: '#111',
  },
  scannedSection: {
    marginTop: 18,
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#111',
  },
  sectionTitle: {
    color: '#f5f2f2',
    marginBottom: 10,
    fontSize: 16,
    fontWeight: '700',
  },
  scannedRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  scannedText: {
    color: '#fff',
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
    padding: 24,
  },
  modalTitle: {
    color: '#ff3b3f',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 10,
  },
  modalHint: {
    color: '#ccc',
    marginBottom: 20,
    fontSize: 14,
  },
  scannerWrapper: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#ff3b3f',
  },
  closeScannerButton: {
    marginTop: 20,
    backgroundColor: '#222',
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: 'center',
  },
  closeScannerText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
