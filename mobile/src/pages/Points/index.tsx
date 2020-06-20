import React, { useState, useEffect } from 'react';
import { Feather as Icon } from '@expo/vector-icons'
import { useNavigation, useRoute } from '@react-navigation/native';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, SafeAreaView, Alert } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { SvgUri } from 'react-native-svg';
import * as Location from 'expo-location';
import api from '../../services/api';

interface Item {
    id: number,
    title: string,
    image_url: string
}

interface Points {
    id: number,
    image: string,
    image_url: string,
    name: string,
    city: string,
    uf: string,
    latitude: number,
    longitude: number,
}

interface Params {
    uf: string,
    city: string
}

const Points = () => {
    const navigation = useNavigation();
    const routeParams = useRoute().params as Params;

    const [itens, setItens] = useState<Item[]>([]);
    const [selectedItens, setSelectedItens] = useState<number[]>([]);
    const [points, setPoints] = useState<Points[]>([]);

    const [initialPosition, setInitialPosition] = useState<[number, number]>([0, 0]);

    useEffect(() => {
        api.get('itens').then(response => {
            setItens(response.data);
        })
    }, []);

    useEffect(() => {
        async function loadPosition() {
            const { status } = await Location.requestPermissionsAsync();

            if (status !== 'granted') {
                Alert.alert('Oooops...', 'Precisamos de sua permissão para obter a localização');
                return;
            }

            const location = await Location.getCurrentPositionAsync();

            const { latitude, longitude } = location.coords;
            setInitialPosition([latitude, longitude]);
        }

        loadPosition();
    }, []);

    useEffect(() => {
        api.get('points', {
            params: {
                city: routeParams.city,
                uf: routeParams.uf,
                itens: selectedItens
            }
        }).then(response => {
            setPoints(response.data);
        })
    }, [selectedItens]);

    const handleNavigateBack = () => {
        navigation.goBack();
    }

    const handleNavigateToDetail = (id: number) => {
        navigation.navigate('Detail', { point_id: id });
    }

    function handleSelectItem(id: number) {
        const alreadySelected = selectedItens.findIndex(item => item === id); //se encontrar retorna a posição, se não retorna -1

        if (alreadySelected >= 0) {
            const filteredItens = selectedItens.filter(item => item !== id); //pega todos menos o id

            setSelectedItens(filteredItens);
        } else {
            setSelectedItens([...selectedItens, id]);
        }
    }

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.container}>
                <TouchableOpacity onPress={handleNavigateBack}>
                    <Icon name='arrow-left' size={20} color='#34cb79' />
                </TouchableOpacity>

                <Text style={styles.title}>Bem vindo.</Text>
                <Text style={styles.description}>Encontre no mapa um ponto de coleta.</Text>

                <View style={styles.mapContainer}>
                    {initialPosition[0] !== 0 && initialPosition[1] !== 0 && (<MapView //mesma coisa que um operador ternário, mas desconsidera o : false
                        style={styles.map}
                        loadingEnabled={initialPosition[0] === 0}
                        initialRegion={{
                            latitude: initialPosition[0],
                            longitude: initialPosition[1],
                            latitudeDelta: 0.014, //zoom
                            longitudeDelta: 0.014,
                        }}
                    >
                        {points.map(point => (
                            <Marker
                                key={point.id + ''}
                                onPress={() => handleNavigateToDetail(point.id)}
                                style={styles.mapMarker}
                                coordinate={{
                                    latitude: point.latitude,
                                    longitude: point.longitude,
                                }}
                            >
                                <View style={styles.mapMarkerContainer}>
                                    <Image
                                        style={styles.mapMarkerImage}
                                        source={{ uri: api.defaults.baseURL + '/uploads/' + point.image }}
                                    />
                                    <Text style={styles.mapMarkerTitle}>{point.name}</Text>
                                </View>
                            </Marker>
                        ))}
                    </MapView>)}
                </View>
            </View>

            <View style={styles.itemsContainer}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={true}
                    contentContainerStyle={{ paddingHorizontal: 32 }}
                >
                    {itens.map(item => (
                        <TouchableOpacity
                            key={String(item.id)}
                            style={[
                                styles.item,
                                selectedItens.includes(item.id) ? styles.selectedItem : {}
                            ]}
                            onPress={() => handleSelectItem(item.id)}
                        >
                            <SvgUri width={42} height={42} uri={api.defaults.baseURL + item.image_url} />
                            <Text style={styles.itemTitle}>{item.title}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 32,
        paddingTop: 20,
    },

    title: {
        fontSize: 20,
        fontFamily: 'Ubuntu_700Bold',
        marginTop: 24,
    },

    description: {
        color: '#6C6C80',
        fontSize: 16,
        marginTop: 4,
        fontFamily: 'Roboto_400Regular',
    },

    mapContainer: {
        flex: 1,
        width: '100%',
        borderRadius: 10,
        overflow: 'hidden',
        marginTop: 16,
    },

    map: {
        width: '100%',
        height: '100%',
    },

    mapMarker: {
        width: 90,
        height: 80,
    },

    mapMarkerContainer: {
        width: 90,
        height: 70,
        backgroundColor: '#34CB79',
        flexDirection: 'column',
        borderRadius: 8,
        overflow: 'hidden',
        alignItems: 'center'
    },

    mapMarkerImage: {
        width: 90,
        height: 45,
        resizeMode: 'cover',
    },

    mapMarkerTitle: {
        flex: 1,
        fontFamily: 'Roboto_400Regular',
        color: '#FFF',
        fontSize: 13,
        lineHeight: 23,
    },

    itemsContainer: {
        flexDirection: 'row',
        marginTop: 16,
        marginBottom: 32,
    },

    item: {
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#eee',
        height: 120,
        width: 120,
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingTop: 20,
        paddingBottom: 16,
        marginRight: 8,
        alignItems: 'center',
        justifyContent: 'space-between',

        textAlign: 'center',
    },

    selectedItem: {
        borderColor: '#34CB79',
        borderWidth: 2,
    },

    itemTitle: {
        fontFamily: 'Roboto_400Regular',
        textAlign: 'center',
        fontSize: 13,
    },
});

export default Points;