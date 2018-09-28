import React, { Component } from 'react';
import {MapView, Location, Permissions} from 'expo';
import {View, Text, StyleSheet, Alert, Button, TextInput} from 'react-native';
import Pusher from 'pusher-js/react-native';

export default class App extends Component {
  constructor(props) {
    super(props)
    this.state ={
      latitude: null,
      longitude: null,
      region: null,
      name: null, 
      title: null,
      friendName: null,
      friendTitle: null,
      friendLatitude: null,
      friendLongitude: null
    }

    console.ignoredYellowBox = [
      'Setting a timer'
      ];
  }
 
  getLocationAsync = async () => {
    let { status } = await Permissions.askAsync(Permissions.LOCATION);
  }
  
  shareLocation(name)
  {
    if (name == null)
      return;

    title = name.replace(/\s/g, '');
    var locationChannel = this.pusher.subscribe('private-'+title);
    this.setState({title});

    locationChannel.bind('pusher:subscription_error', (status) => {
        Alert.alert("Error", status);
    });
    locationChannel.bind('pusher:subscription_succeeded', () => {
        var app = this;

        this.watchId = navigator.geolocation.watchPosition(
          (position) => {
            app.setState({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              error: null,
            });

            app.triggerLocationChangeEvent(locationChannel, position.coords.latitude, position.coords.longitude);            
          },
          (error) => app.setState({ error: error.message }),
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0},
        );
    });
  }

  resetFriendView(friendTitle)
  {
    this.pusher.unsubscribe("private-" + friendTitle);
    this.state.friendTitle = null;
    this.state.friendName = null;
    this.state.friendLatitude = null;
    this.state.friendLongitude = null;
  }

  locateFriend(friendName)
  {
    if (friendName == null)
      return;

    friendTitle = friendName.replace(/\s/g, '');

    // if (this.state.friendTitle)      
    // { 
    //   this.resetFriendView(this.state.friendTitle);
    // }

    var friendChannel = this.pusher.subscribe("private-" + friendTitle);
    this.setState({friendTitle});

    var app = this;

    friendChannel.bind('client-location', (nextLocation) => {      
      app.setState({
        friendLatitude: nextLocation.latitude,
        friendLongitude: nextLocation.longitude,
        error: null,
      });
    });
  }

  triggerLocationChangeEvent (channel, lat, long) {
    location = 
      {
        latitude: lat,
        longitude: long,
      }

    channel.trigger('client-location', location);
  }

  componentDidMount()
  {    
    this.getLocationAsync();
    this.pusher = new Pusher(PUSHER_CLIENTKEY, {
      authEndpoint: 'https://assembly-pusher-auth.herokuapp.com/pusher/auth',
      cluster: PUSHER_CLUSTER,
      encrypted: true
    }); 
    
    
  }

  componentWillUnmount() {
    navigator.geolocation.clearWatch(this.watchId);
  }

  // setName() {
  //   if (this.state.nameText)
  //     this.state.name = this.state.nameText
  // }

  // renderName()
  // {
  //   if (this.state.name)
  //     return (<Text style={styles.headertext}>Welcome {this.state.name}</Text> );
  //   else
  //     return (
      
  //     <View>
  //       <TextInput
  //         style={{height: 40, borderColor: 'gray', borderWidth: 1}}
  //         onChangeText={(text) => this.setState({nameText:text})}
  //       />
  //       <Button title="submit" onPress={this.setName}/>
  //     </View>
  //   )
  // }

  render() {
    let text = ""
    if (this.state.latitude && this.state.longitude) {
        text = this.state.latitude + ',' + this.state.longitude;

        this.state.region = 
        {
          latitude: this.state.latitude,
          longitude: this.state.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421
        }
    } 
    else if (this.state.friendLatitude && this.state.friendLongitude) {
      text = this.state.friendLatitude + ',' + this.state.friendLongitude;

      this.state.region = 
      {
        latitude: this.state.friendLatitude,
        longitude: this.state.friendLongitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421
      }
    }     
    else if (this.state.error)
    {
      text = this.state.error;
    }

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headertext}>{text}</Text> 
          <TextInput
            style={styles.textbox}
            value={this.state.name}
            onChangeText={(name) => this.setState({ name })}
            />
          <Button title="Share location" onPress={() => this.shareLocation(this.state.name) }/>
          <TextInput
            style={styles.textbox}
            value={this.state.friendName}
            onChangeText={(friendName) => this.setState({ friendName })}
            />
          <Button title="Find friend's location" onPress={() => this.locateFriend(this.state.friendName) }/>

        </View>
        {
          this.state.region && 
          <MapView 
            style={styles.map}
            region={this.state.region}          
          >
            {this.state.latitude && 
              <MapView.Marker
                pinColor = {"#FF0000"}
                coordinate={{
                latitude: this.state.latitude, 
                longitude: this.state.longitude}}
                title={this.state.title || "You're here"}
              />
            }
            {this.state.friendLatitude && 
              <MapView.Marker
                pinColor = {"#00FF00"}
                coordinate={{
                latitude: this.state.friendLatitude, 
                longitude: this.state.friendLongitude}}
                title={this.state.friendTitle}
              />
            }
          </MapView>
        }
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end'
  },
  header: {
    padding: 20,
    backgroundColor: '#333',
  },
  header_text: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold'
  },  
  textbox: {
    height: 50, 
    fontSize: 30,
    backgroundColor:'#FFF',
    color: '#000',
    borderColor: 'gray', 
    borderWidth: 1
  },
  map: {
   flex: 1
  },
});


