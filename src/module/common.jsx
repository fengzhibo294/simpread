console.log( "===== simpread option common load =====" )

import Button      from 'button';
import Notify      from 'notify';

import * as ss     from 'stylesheet';
import { storage, Now } from 'storage';
import * as ver    from 'version';
import * as menu   from 'menu';
import * as watch  from 'watch';

export default class CommonOpt extends React.Component {

    static propTypes = {
        sync : React.PropTypes.func,
    }

    state = {
        update: ( update => !update ? "从未同步过，建议同步一次！" : `上次同步时间： ${ update }` ) ( storage.option.update )
    };

    sync() {
        new Notify().Render( 2, "由于 Google 账户的限制，此功能将在下个版本升级为 Dropbox 方案。" );
        /* https://trello.com/c/p8cwFcu1/71-simpread-dropbox
        storage.Sync( "set", time => {
            new Notify().Render( 2, "注意：这是实验性功能，最好采用保存配置文件到本地的方式。" );
            new Notify().Render( 0, "数据同步成功。" );
            this.setState({ update: `上次同步时间： ${ time }` });
            this.props.sync && this.props.sync();
        });*/
    }

    import() {
        const input  = document.createElement( "input" ),
            $input = $(input),
            onload = event => {
                if ( event && event.target && event.target.result ) {
                    try {
                        let json     = JSON.parse( event.target.result );
                        const result = ver.Compare( json.version );
                        if ( result < 0 ) {
                            result == -1 && new Notify().Render( 2, "上传失败，当前版本太低，请升级简悦。" );
                            result == -2 && new Notify().Render( 2, "上传失败，配置文件版本不存在。" );
                        } else {
                            if ( result == 0 ) {
                                const obj = storage.Verify( json );
                                if ( obj.option.code != 0 || obj.focus.code != 0 || obj.read.code != 0 ) {
                                    new Notify().Render( 2, "上传失败，配置项不匹配，请重新上传。" );
                                    return;
                                }
                            } else if ( result == 1 ) {
                                storage.version != json.version &&
                                    ( json.read.sites = storage.Fix( json.read.sites, json.version, storage.version ));
                                json = ver.Verify( json.version, json );
                                new Notify().Render( "上传版本太低，已自动转换为最新版本。" );
                            }
                            menu.Refresh( json.option.menu );
                            storage.Write( ()=> {
                                watch.SendMessage( "import", true );
                                new Notify().Render( "snackbar", "上传成功，请刷新当前页面，以便新配置文件生效。", "刷新", () => {
                                    location.href = location.origin + location.pathname + "?simpread_mode=reload";
                                });
                            }, json );
                        }
                    } catch ( error ) {
                        new Notify().Render( 2, "上传失败，配置文件解析失败，请重新确认。" );
                    }
                }
            };
        $input.attr({ type : "file", multiple : "false" })
            .one( "change", event => {
                    const reader  = new FileReader();
                    reader.onload = onload;
                    reader.readAsText( event.target.files[0] );
        });
        $input.trigger( "click" );
    }

    export() {
        const download = {
                version: storage.version,
                option : { ...storage.option },
                focus  : { ...storage.focus  },
                read   : { ...storage.read   },
                unrdist: storage.unrdist,
            },
            data = "data:text/json;charset=utf-8," + encodeURIComponent( JSON.stringify( download ) ),
            $a   = $( `<a style="display:none" href=${data} download="simpread-config-${Now()}.json"></a>` ).appendTo( "body" );
        $a[0].click();
        $a.remove();
    }

    newsites() {
        storage.GetNewsites( "remote", ( { count }, error ) => {
            if ( !error ) {
                watch.SendMessage( "site", true );
                count == 0 ? new Notify().Render( "适配列表已同步至最新版本。" ) : new Notify().Render( 0, `适配列表已同步成功，本次新增 ${ count } 个站点。` );
            } else {
                new Notify().Render( 3, `同步时发生了一些问题，并不会影响本地配置文件，请稍后再试！` );
            }
        });
    }

    clear() {
        new Notify().Render( "snackbar", "是否清除掉包括本地与网络账户的全部配置文件？", "同意 ", ()=>{
            storage.Clear( "all", () => {
                new Notify().Render( "snackbar", "清除成功，此页面需刷新后才能生效！", "刷新 ", ()=>{
                    location.href = location.origin + location.pathname + "?simpread_mode=clear";
                });
            });
        });
    }

    render() {
        return(
            <div style={{ width: '100%' }}>
                <Button type="raised" text="同步到你的 Google 账户"
                        icon={ ss.IconPath( "sync_icon" ) }
                        color="#fff" backgroundColor="#1976D2"
                        waves="md-waves-effect md-waves-button"
                        tooltip={{ text: this.state.update }}
                        onClick={ ()=>this.sync() } />
                <div style={{ display: 'inline-flex', width: '100%' }}>
                    <Button type="raised" text="从本地导入配置文件" width="100%"
                            icon={ ss.IconPath( "import_icon" ) }
                            color="#fff" backgroundColor="#FF5252"
                            waves="md-waves-effect md-waves-button"
                            tooltip={{ text: "上传后的配置将覆盖掉当前，请注意确认！" }}
                            onClick={ ()=>this.import() } />
                    <Button type="raised" text="导出配置文件到本地" width="100%"
                            icon={ ss.IconPath( "export_icon" ) }
                            color="#fff" backgroundColor="#2196F3"
                            waves="md-waves-effect md-waves-button"
                            onClick={ ()=>this.export() } />
                </div>
                <div style={{ display: 'inline-flex', width: '100%' }}>
                    <Button type="raised" text="手动同步适配列表" width="100%"
                            icon={ ss.IconPath( "website_icon" ) }
                            color="#fff" backgroundColor="#2196F3"
                            waves="md-waves-effect md-waves-button"
                            onClick={ ()=>this.newsites() } />
                    <Button type="raised" text="清除全部数据" width="100%"
                            icon={ ss.IconPath( "clear_icon" ) }
                            tooltip={{ text: "清除掉包括本地与网络账户的全部配置文件，需谨慎！" }}
                            color="#fff" backgroundColor="#757575"
                            waves="md-waves-effect md-waves-button"
                            onClick={ ()=>this.clear() } />
                </div>
            </div>
        )

    }

}